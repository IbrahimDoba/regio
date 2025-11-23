"use client";

import React, { useState } from "react";
import { FaWallet, FaQrcode, FaClock, FaCoins, FaArrowDown, FaArrowUp, FaBuildingColumns, FaCheck, FaPaperPlane, FaHandHoldingDollar, FaXmark } from "react-icons/fa6";
import { useLanguage } from "@/context/LanguageContext";

export default function WalletPage() {
  const { t } = useLanguage();
  const [sendOpen, setSendOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const toggleForm = (type: 'send' | 'request') => {
    if (type === 'send') {
      setSendOpen(!sendOpen);
      setRequestOpen(false);
    } else {
      setRequestOpen(!requestOpen);
      setSendOpen(false);
    }
  };

  const transactions = [
    { id: 1, type: 'in', partner: 'Maria Weber', desc: 'Sale: Homemade Honey', time: 'Today, 14:30', amtR: '+ 12.00 R', amtT: '+ 15 min' },
    { id: 2, type: 'out', partner: 'Peter Müller', desc: 'Service: Dog Sitting', time: 'Yesterday, 09:15', amtR: '', amtT: '- 60 min' },
    { id: 3, type: 'fee', partner: 'System Fee', desc: 'Community Contribution', time: '01. Nov, 00:00', amtR: '', amtT: '- 30 min' },
  ];

  return (
    <div className="bg-[var(--bg-app)] min-h-screen pb-[70px]">
      
      {/* Header */}
      <header className="bg-white border-b border-[#eee] sticky top-0 z-100">
        <div className="flex justify-between items-center p-[15px]">
          <div className="text-[20px] font-[800] text-[#333] flex items-center gap-[10px]">
            <FaWallet className="text-[var(--color-nav-bg)]" /> My Wallet
          </div>
          <div className="cursor-pointer text-[#888] text-[20px]">
            <FaQrcode />
          </div>
        </div>
      </header>

      {/* Balance Cards */}
      <div className="p-[15px] flex gap-[10px] overflow-x-auto pb-[5px]">
        <div className="flex-1 min-w-[160px] rounded-[12px] p-[15px] text-white shadow-md relative overflow-hidden bg-gradient-to-br from-[#8cb348] to-[#5e8e3e]">
          <div className="text-[11px] uppercase tracking-[1px] opacity-80 mb-[5px]">Time Account</div>
          <div className="text-[24px] font-[800] mb-[5px]">12:30</div>
          <div className="text-[14px] font-[500] opacity-90">Hours : Min</div>
          <FaClock className="absolute -right-[10px] -bottom-[10px] text-[80px] opacity-15 -rotate-12" />
        </div>
        <div className="flex-1 min-w-[160px] rounded-[12px] p-[15px] text-white shadow-md relative overflow-hidden bg-gradient-to-br from-[#4a90e2] to-[#0056b3]">
          <div className="text-[11px] uppercase tracking-[1px] opacity-80 mb-[5px]">Regio Account</div>
          <div className="text-[24px] font-[800] mb-[5px]">450.00</div>
          <div className="text-[14px] font-[500] opacity-90">Regio (HUF eq)</div>
          <FaCoins className="absolute -right-[10px] -bottom-[10px] text-[80px] opacity-15 -rotate-12" />
        </div>
      </div>

      {/* Pending Requests */}
      <div className="px-[15px] mb-[10px]">
        <div className="text-[12px] font-bold text-[#888] uppercase tracking-[0.5px] mb-[10px] flex justify-between items-center">
          Open Requests
          <span className="bg-[#f57c00] text-white p-[2px_6px] rounded-[10px] text-[10px]">2 Action needed</span>
        </div>

        <div className="bg-white border border-[#e0e0e0] border-l-[4px] border-l-[#f57c00] rounded-[6px] p-[12px] mb-[10px] shadow-sm">
          <div className="flex justify-between mb-[5px] text-[11px] text-[#666]">
            <span>Incoming Request</span>
            <span>5 mins ago</span>
          </div>
          <div className="flex justify-between items-center mb-[10px]">
            <div>
              <div className="font-bold text-[14px] text-[#333]">From: Lukas Schmidt</div>
              <div className="text-[12px] text-[#666]">Ref: Moving Boxes</div>
            </div>
            <div className="flex gap-[5px]">
              <span className="bg-[#fff3e0] text-[#f57c00] p-[2px_6px] rounded-[4px] text-[11px] font-bold border border-[#ffe0b2]">15.00 R</span>
              <span className="bg-[#fff3e0] text-[#f57c00] p-[2px_6px] rounded-[4px] text-[11px] font-bold border border-[#ffe0b2]">30 min</span>
            </div>
          </div>
          <div className="flex gap-[10px]">
            <button className="flex-1 p-[8px] rounded-[4px] border border-[#ddd] bg-[#f5f5f5] text-[#333] text-[12px] font-[600] cursor-pointer">Deny</button>
            <button className="flex-1 p-[8px] rounded-[4px] border-none bg-[var(--color-green-offer)] text-white text-[12px] font-[600] cursor-pointer">Confirm Pay</button>
          </div>
        </div>

        <div className="bg-white border border-[#e0e0e0] border-l-[4px] border-l-[#999] rounded-[6px] p-[12px] mb-[10px] shadow-sm">
          <div className="flex justify-between mb-[5px] text-[11px] text-[#666]">
            <span>Outgoing Request</span>
            <span>Yesterday</span>
          </div>
          <div className="flex justify-between items-center mb-[10px]">
            <div>
              <div className="font-bold text-[14px] text-[#333]">To: Sarah Jenkins</div>
              <div className="text-[12px] text-[#666]">Ref: Kärcher Rental</div>
            </div>
            <div className="flex gap-[5px]">
              <span className="bg-[#f5f5f5] text-[#666] p-[2px_6px] rounded-[4px] text-[11px] font-bold border border-[#ddd]">5.00 R</span>
            </div>
          </div>
          <div className="flex gap-[10px]">
            <button className="w-full p-[8px] rounded-[4px] border border-[#ddd] bg-[#f5f5f5] text-[#666] text-[12px] font-[600] cursor-pointer">Cancel Request</button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-[15px] p-[10px_15px_20px_15px] justify-center border-b border-[#f0f0f0]">
        <div 
          className={`flex-1 bg-white border rounded-[8px] p-[12px] text-center cursor-pointer transition-all shadow-sm flex flex-col items-center gap-[5px] hover:-translate-y-[2px] hover:bg-[#f9f9f9] ${sendOpen ? 'border-[var(--color-green-offer)] bg-[#f0f7e6]' : 'border-[#e0e0e0]'}`}
          onClick={() => toggleForm('send')}
        >
          <FaPaperPlane className="text-[20px] text-[var(--color-nav-bg)]" />
          <span className="text-[12px] font-bold text-[#555]">Send</span>
        </div>
        <div 
          className={`flex-1 bg-white border rounded-[8px] p-[12px] text-center cursor-pointer transition-all shadow-sm flex flex-col items-center gap-[5px] hover:-translate-y-[2px] hover:bg-[#f9f9f9] ${requestOpen ? 'border-[var(--color-green-offer)] bg-[#f0f7e6]' : 'border-[#e0e0e0]'}`}
          onClick={() => toggleForm('request')}
        >
          <FaHandHoldingDollar className="text-[20px] text-[var(--color-nav-bg)]" />
          <span className="text-[12px] font-bold text-[#555]">Request</span>
        </div>
      </div>

      {/* Collapsible Forms */}
      <div className={`bg-[#f9f9f9] border-b border-[#e0e0e0] overflow-hidden transition-[max-height] duration-300 ease-out ${sendOpen ? 'max-h-[500px] shadow-[inset_0_5px_10px_-5px_rgba(0,0,0,0.1)]' : 'max-h-0'}`}>
        <div className="p-[20px]">
          <div className="text-[14px] font-bold mb-[15px] text-[#333] border-b-[2px] border-[var(--color-green-offer)] inline-block pb-[2px]">Send Payment</div>
          <div className="mb-[12px]">
            <label className="block text-[11px] font-bold text-[#666] mb-[4px]">Recipient</label>
            <input type="text" className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]" placeholder="Search user..." />
          </div>
          <div className="flex gap-[10px] mb-[12px]">
            <div className="flex-1"><label className="block text-[11px] font-bold text-[#666] mb-[4px]">Regio</label><input type="number" className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]" placeholder="0.00" /></div>
            <div className="flex-1"><label className="block text-[11px] font-bold text-[#666] mb-[4px]">Time (Min)</label><input type="number" className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]" placeholder="0" /></div>
          </div>
          <div className="mb-[12px]">
            <label className="block text-[11px] font-bold text-[#666] mb-[4px]">Reference</label>
            <input type="text" className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]" placeholder="Reason..." />
          </div>
          <button className="w-full p-[12px] bg-[var(--color-green-offer)] text-white border-none rounded-[4px] font-bold cursor-pointer mt-[10px]">Confirm Transfer</button>
        </div>
      </div>

      <div className={`bg-[#f9f9f9] border-b border-[#e0e0e0] overflow-hidden transition-[max-height] duration-300 ease-out ${requestOpen ? 'max-h-[500px] shadow-[inset_0_5px_10px_-5px_rgba(0,0,0,0.1)]' : 'max-h-0'}`}>
        <div className="p-[20px]">
          <div className="text-[14px] font-bold mb-[15px] text-[#333] border-b-[2px] border-[#4285f4] inline-block pb-[2px]">Request Payment</div>
          <div className="mb-[12px]">
            <label className="block text-[11px] font-bold text-[#666] mb-[4px]">From User</label>
            <input type="text" className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]" placeholder="Search user..." />
          </div>
          <div className="flex gap-[10px] mb-[12px]">
            <div className="flex-1"><label className="block text-[11px] font-bold text-[#666] mb-[4px]">Regio</label><input type="number" className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]" placeholder="0.00" /></div>
            <div className="flex-1"><label className="block text-[11px] font-bold text-[#666] mb-[4px]">Time (Min)</label><input type="number" className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]" placeholder="0" /></div>
          </div>
          <div className="mb-[12px]">
            <label className="block text-[11px] font-bold text-[#666] mb-[4px]">Reason</label>
            <input type="text" className="w-full p-[10px] border border-[#ccc] rounded-[4px] bg-white text-[14px]" placeholder="Reason..." />
          </div>
          <button className="w-full p-[12px] bg-[#4285f4] text-white border-none rounded-[4px] font-bold cursor-pointer mt-[10px]">Send Request</button>
        </div>
      </div>

      {/* History */}
      <div className="flex-grow bg-white pt-0">
        <div className="p-[15px] bg-[#fafafa] border-b border-[#eee] flex justify-between items-center">
          <span className="text-[14px] font-bold text-[#555] uppercase tracking-[0.5px]">Transactions</span>
          <select className="p-[5px_10px] border border-[#ddd] rounded-[4px] text-[12px] text-[#555] bg-white cursor-pointer">
            <option>2 Weeks</option>
            <option>1 Month</option>
            <option>3 Months</option>
          </select>
        </div>

        <ul className="list-none">
          {transactions.map(tx => (
            <li 
              key={tx.id} 
              className="flex items-center p-[15px] border-b border-[#f5f5f5] cursor-pointer transition-colors active:bg-[#f0f0f0]"
              onClick={() => setSelectedTx(tx)}
            >
              <div className={`w-[40px] h-[40px] rounded-full flex justify-center items-center mr-[12px] text-[18px] shrink-0 ${tx.type === 'in' ? 'bg-[#e8f5e9] text-[#2e7d32]' : tx.type === 'out' ? 'bg-[#ffebee] text-[#c62828]' : 'bg-[#eee] text-[#555]'}`}>
                {tx.type === 'in' ? <FaArrowDown /> : tx.type === 'out' ? <FaArrowUp /> : <FaBuildingColumns />}
              </div>
              <div className="flex-grow overflow-hidden">
                <div className="text-[14px] font-[600] text-[#222] mb-[2px]">{tx.partner}</div>
                <span className="text-[12px] text-[#888] whitespace-nowrap overflow-hidden text-ellipsis block">{tx.desc}</span>
                <div className="text-[11px] text-[#aaa] mt-[2px]">{tx.time}</div>
              </div>
              <div className="flex gap-[8px] items-center ml-[10px]">
                {tx.amtR && <span className={`p-[4px_8px] rounded-[4px] text-[12px] font-bold whitespace-nowrap border ${tx.type === 'in' ? 'text-[#2e7d32] border-[#c8e6c9] bg-[#e8f5e9]' : 'text-[#c62828] border-[#ffcdd2] bg-[#ffebee]'}`}>{tx.amtR}</span>}
                {tx.amtT && <span className={`p-[4px_8px] rounded-[4px] text-[12px] font-bold whitespace-nowrap border ${tx.type === 'in' ? 'text-[#2e7d32] border-[#c8e6c9] bg-[#e8f5e9]' : 'text-[#c62828] border-[#ffcdd2] bg-[#ffebee]'}`}>{tx.amtT}</span>}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Tx Details Modal */}
      {selectedTx && (
        <div className="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.6)] z-[1000] flex justify-center items-center backdrop-blur-[3px] animate-in fade-in duration-200" onClick={(e) => e.target === e.currentTarget && setSelectedTx(null)}>
          <div className="w-[85%] max-w-[400px] bg-white rounded-[12px] p-[20px] relative shadow-2xl text-center animate-in zoom-in-95">
            <div className={`w-[60px] h-[60px] mx-auto mb-[15px] rounded-full flex justify-center items-center text-[24px] ${selectedTx.type === 'in' ? 'bg-[#e8f5e9] text-[#2e7d32]' : selectedTx.type === 'out' ? 'bg-[#ffebee] text-[#c62828]' : 'bg-[#eee] text-[#555]'}`}>
              {selectedTx.type === 'in' ? <FaArrowDown /> : selectedTx.type === 'out' ? <FaArrowUp /> : <FaBuildingColumns />}
            </div>
            
            <div className="flex justify-center gap-[15px] mb-[5px]">
              {selectedTx.amtR && <div className={`text-[20px] font-[800] ${selectedTx.type === 'in' ? 'text-[#2e7d32]' : 'text-[#c62828]'}`}>{selectedTx.amtR}</div>}
              {selectedTx.amtT && <div className={`text-[20px] font-[800] ${selectedTx.type === 'in' ? 'text-[#2e7d32]' : 'text-[#c62828]'}`}>{selectedTx.amtT}</div>}
            </div>
            
            <div className="text-[13px] text-[#888] mb-[20px]">{selectedTx.time}</div>
            
            <div className="flex justify-between border-b border-[#eee] py-[10px] text-[14px]">
              <span className="text-[#888]">Partner</span>
              <span className="font-[600]">{selectedTx.partner}</span>
            </div>
            <div className="flex justify-between border-b border-[#eee] py-[10px] text-[14px]">
              <span className="text-[#888]">Reference</span>
              <span className="font-[600]">{selectedTx.desc}</span>
            </div>
            <div className="flex justify-between border-b border-[#eee] py-[10px] text-[14px]">
              <span className="text-[#888]">Transaction ID</span>
              <span className="font-[600]">#8839201</span>
            </div>

            <button className="mt-[20px] w-full p-[12px] bg-[#eee] border-none rounded-[8px] font-bold text-[#333] cursor-pointer" onClick={() => setSelectedTx(null)}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
}
