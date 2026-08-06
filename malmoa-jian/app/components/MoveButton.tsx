'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ElementType } from 'react'

interface MoveButtonProps {
  text: string;
  icon?: ElementType;
  href: string;
}

export default function MoveButton({ text, href, icon:Icon }: MoveButtonProps) {
  const pathname = usePathname();
  const isCurrentPage = pathname === href;

  return (
    <Link
      href={href}
      className="leftbar-design"
      style={{
        backgroundColor: isCurrentPage ? '#E6F8F1' : '#F0F0F4',
        color: isCurrentPage ? '#149E69' : '#9C9BA8',
      }}
    >
      {Icon && <Icon size={32} />}
      <span>{text}</span>
    </Link>
  );
}