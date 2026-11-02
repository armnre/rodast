import { motion } from 'framer-motion';
import { LogoMark } from './Logo';

export default function Splash() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <motion.div animate={{ rotate: [0, -12, 10, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}>
        <LogoMark size={72} />
      </motion.div>
    </div>
  );
}
