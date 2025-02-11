import React, { useState } from 'react';
import { isValidIPv4, isValidCIDR, cidrToNetmask } from '../utils/networkUtils';

interface NetworkFormProps {
  onSubmit: (data: { network: string; netmask: string; name: string }) => void;
}

export function NetworkForm({ onSubmit }: NetworkFormProps) {
  const [network, setNetwork] = useState('');
  const [netmask, setNetmask] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [useCIDR, setUseCIDR] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (useCIDR) {
      if (!isValidCIDR(network)) {
        setError('Invalid CIDR notation');
        return;
      }
      const [networkAddr, cidr] = network.split('/');
      onSubmit({
        network: networkAddr,
        netmask: cidrToNetmask(parseInt(cidr, 10)),
        name
      });
    } else {
      if (!isValidIPv4(network)) {
        setError('Invalid network address');
        return;
      }
      
      if (!isValidIPv4(netmask)) {
        setError('Invalid netmask');
        return;
      }

      onSubmit({ network, netmask, name });
    }
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Network Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <input
          type="checkbox"
          id="useCIDR"
          checked={useCIDR}
          onChange={(e) => setUseCIDR(e.target.checked)}
          className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
        />
        <label htmlFor="useCIDR" className="text-sm text-gray-700">
          Use CIDR Notation
        </label>
      </div>

      {useCIDR ? (
        <div>
          <label htmlFor="network" className="block text-sm font-medium text-gray-700">
            Network CIDR
          </label>
          <input
            type="text"
            id="network"
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            placeholder="192.168.0.0/24"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="network" className="block text-sm font-medium text-gray-700">
              Network Address
            </label>
            <input
              type="text"
              id="network"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              placeholder="192.168.0.0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="netmask" className="block text-sm font-medium text-gray-700">
              Netmask
            </label>
            <input
              type="text"
              id="netmask"
              value={netmask}
              onChange={(e) => setNetmask(e.target.value)}
              placeholder="255.255.255.0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </>
      )}

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Create Network Plan
      </button>
    </form>
  );
}