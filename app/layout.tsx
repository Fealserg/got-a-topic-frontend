import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Перерыв — люди, с которыми есть о чём поговорить', description: 'Найдите собеседника с нужным опытом на Analyst Days. 15 минут, общая тема и полезное знакомство.' };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ru"><body>{children}</body></html>; }
