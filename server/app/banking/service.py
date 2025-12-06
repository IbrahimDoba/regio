from decimal import Decimal
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime

from sqlalchemy.orm import selectinload
from sqlmodel import select, update, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.users.models import User
from app.users.enums import TrustLevel
from app.banking.models import Account, Transaction, PaymentRequest
from app.banking.enums import Currency, PaymentStatus, TransactionType
from app.banking.schemas import TransactionPublic, TransactionHistory, TransactionMeta

from app.banking.constants import (
    MONTHLY_FEE_MINUTES,
    DEMURRAGE_THRESHOLD_MINUTES,
    DEMURRAGE_RATE_ANNUAL,
    TRUST_LIMITS,
    TRUST_UPGRADE_THRESHOLDS
)
from app.banking.exceptions import (
    AccountNotFound,
    InvalidTransactionAmount,
    SelfTransferError,
    InsufficientFunds,
    TransactionConflict,
    PaymentRequestNotFound,
    InvalidPaymentRequestStatus,
    UnauthorizedPaymentRequestAccess
)
from app.users.exceptions import UserNotFound

class BankingService:
    def __init__(self, session: AsyncSession):
        self.session = session

    # HELPERS

    def _validate_transaction_amounts(self, amount_time: int, amount_regio: Decimal):
        """Ensures positive amounts and basic sanity checks."""
        if amount_time < 0 or amount_regio < 0:
            raise InvalidTransactionAmount("Negative amounts are not allowed.")
        if amount_time == 0 and amount_regio == 0:
            raise InvalidTransactionAmount("Transaction must have a value > 0.")

    def _calculate_new_trust_level(self, current_total_earned: int) -> TrustLevel:
        for level, threshold in TRUST_UPGRADE_THRESHOLDS:
            if current_total_earned >= threshold:
                return level
        return TrustLevel.T1

    def _is_higher_level(self, new_level: TrustLevel, current_level: TrustLevel) -> bool:
        levels = [TrustLevel.T1, TrustLevel.T2, TrustLevel.T3, TrustLevel.T4, TrustLevel.T5, TrustLevel.T6]
        try:
            return levels.index(new_level) > levels.index(current_level)
        except ValueError:
            return False

    async def _get_account_or_fail(self, user_id: uuid.UUID, currency_type: Currency) -> Account:
        statement = select(Account).where(Account.user_id == user_id, Account.type == currency_type)
        result = await self.session.execute(statement)
        account = result.scalar_one_or_none()
        if not account:
            raise AccountNotFound(f"Account {currency_type} not found for user {user_id}")
        return account

    async def _get_user_by_code_or_fail(self, user_code: str) -> User:
        statement = select(User).where(User.user_code == user_code)
        result = await self.session.execute(statement)
        user = result.scalar_one_or_none()
        if not user:
            raise UserNotFound(f"User {user_code} not found")
        return user

    # CORE LOGIC

    async def create_initial_accounts(self, user_id: uuid.UUID) -> None:
        """
        Generates the initial TIME and REGIO accounts for a new user.
        """
        time_acc = Account(user_id=user_id, type=Currency.TIME, balance_time=0, version=1)
        regio_acc = Account(user_id=user_id, type=Currency.REGIO, balance_regio=Decimal("0.00"), version=1)
        
        self.session.add(time_acc)
        self.session.add(regio_acc)

    async def transfer_funds(
        self,
        sender_code: str,
        receiver_code: str,
        amount_time: int,
        amount_regio: Decimal,
        reference: str,
        payment_request_id: Optional[uuid.UUID] = None,
        skip_limit_check: bool = False
    ) -> Transaction:
        # Input Validation
        self._validate_transaction_amounts(amount_time, amount_regio)
        if sender_code == receiver_code:
            raise SelfTransferError()

        # Resolve Users
        sender = await self._get_user_by_code_or_fail(sender_code)
        receiver = await self._get_user_by_code_or_fail(receiver_code)

        # Load Accounts
        sender_time_acc = await self._get_account_or_fail(sender.id, Currency.TIME)
        sender_regio_acc = await self._get_account_or_fail(sender.id, Currency.REGIO)
        
        receiver_time_acc = await self._get_account_or_fail(receiver.id, Currency.TIME)
        receiver_regio_acc = await self._get_account_or_fail(receiver.id, Currency.REGIO)

        # Limit Checks (VERY IMPORTANT)
        if not skip_limit_check:
            limits = TRUST_LIMITS.get(sender.trust_level, TRUST_LIMITS[TrustLevel.T1])
            limit_time_min, limit_regio_min = limits

            potential_time_bal = sender_time_acc.balance_time - amount_time
            potential_regio_bal = sender_regio_acc.balance_regio - amount_regio

            if potential_time_bal < limit_time_min:
                raise InsufficientFunds("TIME", potential_time_bal, limit_time_min)
            
            if potential_regio_bal < limit_regio_min:
                raise InsufficientFunds("REGIO", float(potential_regio_bal), float(limit_regio_min))

        # Optimistic Locking Updates
        # Update Sender TIME
        stmt_sender_time = (
            update(Account)
            .where(Account.id == sender_time_acc.id, Account.version == sender_time_acc.version)
            .values(balance_time=sender_time_acc.balance_time - amount_time, version=sender_time_acc.version + 1)
        )
        if (await self.session.execute(stmt_sender_time)).rowcount == 0:
            raise TransactionConflict()

        # Update Sender REGIO
        stmt_sender_regio = (
            update(Account)
            .where(Account.id == sender_regio_acc.id, Account.version == sender_regio_acc.version)
            .values(balance_regio=sender_regio_acc.balance_regio - amount_regio, version=sender_regio_acc.version + 1)
        )
        if (await self.session.execute(stmt_sender_regio)).rowcount == 0:
            raise TransactionConflict()

        # Update Receiver TIME
        stmt_rec_time = (
            update(Account)
            .where(Account.id == receiver_time_acc.id, Account.version == receiver_time_acc.version)
            .values(balance_time=receiver_time_acc.balance_time + amount_time, version=receiver_time_acc.version + 1)
        )
        if (await self.session.execute(stmt_rec_time)).rowcount == 0:
            raise TransactionConflict()

        # Update Receiver REGIO
        stmt_rec_regio = (
            update(Account)
            .where(Account.id == receiver_regio_acc.id, Account.version == receiver_regio_acc.version)
            .values(balance_regio=receiver_regio_acc.balance_regio + amount_regio, version=receiver_regio_acc.version + 1)
        )
        if (await self.session.execute(stmt_rec_regio)).rowcount == 0:
            raise TransactionConflict()

        # Trust Level Logic
        if amount_time > 0:
            new_total_earned = receiver.total_time_earned + amount_time
            receiver.total_time_earned = new_total_earned
            self.session.add(receiver)
            
            potential_level = self._calculate_new_trust_level(new_total_earned)
            if self._is_higher_level(potential_level, receiver.trust_level):
                receiver.trust_level = potential_level
                self.session.add(receiver)

        # Record Transaction
        transaction = Transaction(
            sender_id=sender.id,
            receiver_id=receiver.id,
            amount_time=amount_time,
            amount_regio=amount_regio,
            reference=reference,
            payment_request_id=payment_request_id
        )
        self.session.add(transaction)
        
        await self.session.commit() 
        await self.session.refresh(transaction)

        # Attach objects to transaction to avoid lazy loading issues in the route
        transaction.receiver = receiver
        transaction.sender = sender

        return transaction

    async def get_transaction_history(
        self, 
        user: User,
        page: int = 1, 
        page_size: int = 50
    ) -> Dict[str, Any]:
        """
        Returns transaction history transformed for the specific viewer (user).
        """
        skip = (page - 1) * page_size

        # Count Query
        count_statement = select(func.count()).where(
            or_(Transaction.sender_id == user.id, Transaction.receiver_id == user.id)
        )
        total_count: int = (await self.session.execute(count_statement)).one()[0]

        # Data Query - Eager load Sender/Receiver to map codes
        statement = (
            select(Transaction)
            .where(or_(Transaction.sender_id == user.id, Transaction.receiver_id == user.id))
            .options(selectinload(Transaction.sender), selectinload(Transaction.receiver))
            .order_by(Transaction.created_at.desc())
            .offset(skip)
            .limit(page_size)
        )
        transactions = (await self.session.execute(statement)).scalars().all()

        # Transformation Logic
        formatted_data = []
        for tx in transactions:
            is_outgoing = tx.sender_id == user.id
            other_party = tx.receiver if is_outgoing else tx.sender
            
            formatted_data.append(TransactionPublic(
                id=tx.id,
                date=tx.created_at,
                type=TransactionType.OUTGOING if is_outgoing else TransactionType.INCOMING,
                other_party_code=other_party.user_code,
                other_party_name=f"{other_party.first_name} {other_party.last_name}",
                amount_time=tx.amount_time,
                amount_regio=tx.amount_regio,
                reference=tx.reference,
                is_system_fee=tx.is_system_fee
            ))

        # Calculate Total Pages
        total_pages = (total_count + page_size - 1) // page_size

        return TransactionHistory(
            data=formatted_data,
            meta=TransactionMeta(
                page=page,
                page_size=page_size,
                total_count=total_count,
                total_pages=total_pages
            )
        )

    async def get_balance_info(self, user_code: str):
        user = await self._get_user_by_code_or_fail(user_code)
        
        time_acc = await self._get_account_or_fail(user.id, Currency.TIME)
        regio_acc = await self._get_account_or_fail(user.id, Currency.REGIO)
        
        limits = TRUST_LIMITS.get(user.trust_level, TRUST_LIMITS[TrustLevel.T1])
        limit_time, limit_regio = limits

        return {
            "user_code": user.user_code,
            "trust_level": user.trust_level,
            "total_time_earned": user.total_time_earned,
            "balance": {
                "time": time_acc.balance_time,
                "regio": regio_acc.balance_regio
            },
            "limits": {
                "max_debt_time": limit_time,
                "max_debt_regio": limit_regio,
                "available_time": time_acc.balance_time - limit_time,
                "available_regio": regio_acc.balance_regio - limit_regio
            }
        }

    async def create_payment_request(
        self,
        creditor_code: str,
        debtor_code: str,
        amount_time: int,
        amount_regio: Decimal,
        description: str
    ) -> PaymentRequest:
        self._validate_transaction_amounts(amount_time, amount_regio)
        if creditor_code == debtor_code:
            raise SelfTransferError()
        
        creditor = await self._get_user_by_code_or_fail(creditor_code)
        debtor = await self._get_user_by_code_or_fail(debtor_code)

        req = PaymentRequest(
            creditor_id=creditor.id,
            debtor_id=debtor.id,
            amount_time=amount_time,
            amount_regio=amount_regio,
            description=description,
            status=PaymentStatus.PENDING
        )
        self.session.add(req)
        await self.session.commit()
        await self.session.refresh(req)

        # Attach objects for immediate UI usage (e.g. showing names in response)
        req.creditor = creditor
        req.debtor = debtor
        
        return req

    async def get_incoming_payment_requests(self, user: User) -> List[PaymentRequest]:
        """Requests where the user is the DEBTOR (needs to pay)."""
        stmt = (
            select(PaymentRequest)
            .where(PaymentRequest.debtor_id == user.id, PaymentRequest.status == PaymentStatus.PENDING)
            .options(selectinload(PaymentRequest.creditor)) # Load creditor for UI display
            .order_by(PaymentRequest.created_at.desc())
        )
        return (await self.session.execute(stmt)).scalars().all()

    async def process_payment_request(
        self, 
        request_id: uuid.UUID, 
        debtor_id: Optional[uuid.UUID], 
        action: str
    ):
        stmt = select(PaymentRequest).where(PaymentRequest.id == request_id)
        req = (await self.session.execute(stmt)).scalar_one_or_none()
        
        if not req:
            raise PaymentRequestNotFound()
            
        if req.status != PaymentStatus.PENDING:
            raise InvalidPaymentRequestStatus(req.status)
            
        # Permission Check (debtor_id is None if Admin)
        if debtor_id and req.debtor_id != debtor_id:
             raise UnauthorizedPaymentRequestAccess()
             
        if action == "REJECT":
            req.status = PaymentStatus.REJECTED
            self.session.add(req)
            await self.session.commit()
            return req
            
        elif action == "APPROVE":
            # Need to fetch codes for transfer function
            creditor = await self.session.get(User, req.creditor_id)
            debtor = await self.session.get(User, req.debtor_id)
            
            # This might raise InsufficientFunds, which is good
            tx = await self.transfer_funds(
                sender_code=debtor.user_code,
                receiver_code=creditor.user_code,
                amount_time=req.amount_time,
                amount_regio=req.amount_regio,
                reference=f"Payment Req: {req.description or 'Confirmed'}",
                payment_request_id=req.id,
                skip_limit_check=False 
            )
            
            req.status = PaymentStatus.EXECUTED
            req.transaction_id = tx.id
            self.session.add(req)
            await self.session.commit()
            return req
        else:
            raise ValueError("Invalid Action")

    # CRON / SYSTEM JOBS
    # (Kept mostly same, just update to use new transfer_funds signature if needed)
    async def collect_monthly_fees(self):
        stmt_sys = select(User).where(User.user_code == settings.SYSTEM_SINK_CODE)
        if not (await self.session.execute(stmt_sys)).scalar_one_or_none():
            raise Exception("System Sink User not found")

        stmt_users = select(User).where(User.is_active == True, User.is_system_admin == False)
        users = (await self.session.execute(stmt_users)).scalars().all()

        results = []
        for user in users:
            try:
                await self.transfer_funds(
                    sender_code=user.user_code,
                    receiver_code=settings.SYSTEM_SINK_CODE,
                    amount_time=MONTHLY_FEE_MINUTES,
                    amount_regio=Decimal(0),
                    reference="Membership Fee",
                    skip_limit_check=True 
                )
                results.append({"user": user.user_code, "status": "SUCCESS"})
            except Exception as e:
                results.append({"user": user.user_code, "status": "FAILED", "error": str(e)})
        return results

    async def process_demurrage(self):
        statement = (
            select(Account)
            .join(User)
            .where(
                Account.type == Currency.TIME,
                Account.balance_time > DEMURRAGE_THRESHOLD_MINUTES,
                User.is_system_admin == False
            )
        )
        hoarding_accounts = (await self.session.execute(statement)).scalars().all()

        now = datetime.utcnow()
        processed_count = 0
        total_minutes = 0

        for acc in hoarding_accounts:
            user = await self.session.get(User, acc.user_id)
            last_calc = acc.last_demurrage_calc or now 
            delta = now - last_calc
            days_elapsed = delta.total_seconds() / (24 * 3600)

            if days_elapsed < 1:
                continue

            taxable_amount = acc.balance_time - DEMURRAGE_THRESHOLD_MINUTES
            daily_rate = DEMURRAGE_RATE_ANNUAL / 365
            demurrage_minutes = int(round(taxable_amount * daily_rate * days_elapsed))

            if demurrage_minutes > 0:
                try:
                    await self.transfer_funds(
                        sender_code=user.user_code,
                        receiver_code=settings.SYSTEM_SINK_CODE,
                        amount_time=demurrage_minutes,
                        amount_regio=Decimal(0),
                        reference=f"Demurrage ({days_elapsed:.1f} days)",
                        skip_limit_check=True
                    )
                    total_minutes += demurrage_minutes
                    processed_count += 1
                except Exception as e:
                    print(f"Failed demurrage for {user.user_code}: {e}")
            
            acc.last_demurrage_calc = now
            self.session.add(acc)
        
        await self.session.commit()
        return {
            "processed_users": processed_count, 
            "total_minutes_collected": total_minutes
        }
