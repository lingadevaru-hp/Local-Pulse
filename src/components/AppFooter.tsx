
import type { FC } from 'react';
import Link from 'next/link';

const AppFooter: FC = () => {
  return (
    <footer className="glass-effect py-6 px-4 text-center text-sm text-muted-foreground border-t mt-auto rounded-t-xl">
      <div className="flex justify-center space-x-4 mb-3">
        <Link href="/about" className="hover:text-primary transition-colors">
          About
        </Link>
        <Link href="/contact" className="hover:text-primary transition-colors">
          Contact
        </Link>
        <Link href="/terms" className="hover:text-primary transition-colors">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-primary transition-colors">
          Privacy
        </Link>
      </div>
      <p>&copy; {new Date().getFullYear()} Local Pulse. All rights reserved.</p>
    </footer>
  );
};

export default AppFooter;
