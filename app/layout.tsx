import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Есть тема — нетворкинг по интересам', description: 'Есть что обсудить. Осталось найти с кем. Найдите собеседника по интересам и договоритесь о встрече на Analyst Days.' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ru"><body>{children}</body></html>; }
