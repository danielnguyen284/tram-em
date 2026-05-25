import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import styles from './Breadcrumb.module.css';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Props = {
  items: BreadcrumbItem[];
};

/**
 * Unified breadcrumb navigation.
 * Usage: <Breadcrumb items={[{ label: 'Games', href: '/games' }, { label: '2048' }]} />
 * Renders: Games › 2048
 */
export default function Breadcrumb({ items }: Props) {
  return (
    <nav className={styles.breadcrumb} aria-label="Điều hướng">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className={styles.item}>
            {index > 0 && (
              <ChevronRight size={16} className={styles.separator} aria-hidden="true" />
            )}
            {item.href && !isLast ? (
              <Link href={item.href} className={styles.link}>
                {item.label}
              </Link>
            ) : (
              <span className={styles.current} aria-current={isLast ? 'page' : undefined}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
