import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiWifi, FiWifiOff, FiLoader } = FiIcons;

const ConnectionStatus = ({ isConnected, isLoading, onRetry }) => {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-3 py-1 bg-yellow-900 bg-opacity-50 rounded-full text-yellow-300 text-xs"
      >
        <SafeIcon icon={FiLoader} className="w-3 h-3 animate-spin" />
        <span>Connexion en cours...</span>
      </motion.div>
    );
  }

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-3 py-1 bg-red-900 bg-opacity-50 rounded-full text-red-300 text-xs cursor-pointer hover:bg-red-800 bg-opacity-70 transition-colors"
        onClick={onRetry}
        title="Cliquez pour reconnecter"
      >
        <SafeIcon icon={FiWifiOff} className="w-3 h-3" />
        <span>Hors ligne</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-1 bg-green-900 bg-opacity-50 rounded-full text-green-300 text-xs"
    >
      <SafeIcon icon={FiWifi} className="w-3 h-3" />
      <span>Connecté</span>
    </motion.div>
  );
};

export default ConnectionStatus;