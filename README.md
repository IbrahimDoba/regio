# Regio - Local Exchange Platform

Regio is a modern web application designed to foster a fair local economy. It allows users to exchange goods and services using both a community currency ("Regio") and time credits, promoting trust and local cooperation.

## 🚀 Project Overview

This project is a port of a high-fidelity HTML/CSS/JS prototype into a robust **Next.js** application. It aims to provide a seamless user experience for browsing local offers, managing digital assets, and interacting with the community.

### Key Features

-   **🏠 Smart Feed**: A dynamic feed of offers and requests, filterable by category (Goods, Services, Food, etc.), distance, and type.
-   **🔐 Authentication**: Secure login and registration flows, including a "No Code" access modal.
-   **👤 User Profile**: Comprehensive profile management with tabs for Personal details, Account settings, and Trust/Verification status.
-   **💰 Digital Wallet**: A dual-currency wallet system tracking "Regio" (currency) and "Time" (hours/minutes), with features to send and request payments.
-   **✅ Identity Verification**: A multi-step verification process (Registration -> Video Call -> Active) to ensure community safety.
-   **🔔 Notifications**: Real-time updates for system messages, chats, and transactions.
-   **💌 Invite System**: A growth mechanism allowing verified users to invite friends using unique codes.
-   **🌍 Internationalization**: Built-in support for multiple languages (English, German, Hungarian).

## 🛠️ Tech Stack

-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Icons**: [React Icons](https://react-icons.github.io/react-icons/) (Fa6)
-   **State Management**: React Context API (for Language and Global State)

## 📂 Project Structure

```
src/
├── app/
│   ├── (app)/          # Main application routes (Feed, Profile, Wallet, etc.)
│   ├── (auth)/         # Authentication routes (Login, Register)
│   ├── globals.css     # Global styles and Tailwind directives
│   └── layout.tsx      # Root layout with LanguageProvider
├── components/
│   ├── feed/           # Feed-related components (Card, List, Filter)
│   ├── layout/         # Layout components (Header, BottomNav, MobileContainer)
│   └── modals/         # Modal components (Create, Preview)
├── context/            # React Contexts (LanguageContext)
├── data/               # Mock data and translations
└── lib/                # Utility functions and TypeScript types
```

## 🚦 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/IbrahimDoba/regio.git
    cd regio
    ```

2.  **Install dependencies:**
    ```bash
    cd regio  # Navigate to the Next.js app directory
    pnpm install
    ```

3.  **Run the development server:**
    ```bash
    pnpm dev
    ```

4.  **Open the app:**
    Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 🔮 Future Roadmap

-   [ ] Backend integration (API routes, Database).
-   [ ] Real-time chat implementation.
-   [ ] Map view for local offers.
-   [ ] Advanced search functionality.
