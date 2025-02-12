import React, { useState, useEffect } from 'react';
import { NetworkForm } from './components/NetworkForm';
import { NetworkVisualizer } from './components/NetworkVisualizer';
import { NetworkActions } from './components/NetworkActions';
import { NetworkPlan, SubnetSegment } from './types/network';
import { calculateSubnetInfo } from './utils/networkUtils';
import { Network, Edit2, Trash2, Upload } from 'lucide-react';

function App() {
  const [networks, setNetworks] = useState<NetworkPlan[]>(() => {
    const saved = localStorage.getItem('networkPlans');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedNetwork, setSelectedNetwork] = useState<NetworkPlan | null>(null);
  const [editingNetworkName, setEditingNetworkName] = useState(false);

  useEffect(() => {
    localStorage.setItem('networkPlans', JSON.stringify(networks));
  }, [networks]);

  const handleCreateNetwork = ({ network, netmask, name }: { network: string; netmask: string; name: string }) => {
    const subnetInfo = calculateSubnetInfo(network, netmask);
    
    const newNetwork: NetworkPlan = {
      id: Date.now().toString(),
      name,
      baseNetwork: network,
      baseNetmask: netmask,
      segments: [{
        name: 'Base Network',
        network,
        netmask,
        gateway: subnetInfo.firstUsable,
        broadcast: subnetInfo.broadcast,
        firstUsable: subnetInfo.firstUsable,
        lastUsable: subnetInfo.lastUsable,
        totalHosts: subnetInfo.totalHosts,
        usableHosts: subnetInfo.usableHosts,
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNetworks(prev => [...prev, newNetwork]);
    setSelectedNetwork(newNetwork);
  };

  const handleUpdateSegments = (newSegments: SubnetSegment[]) => {
    if (!selectedNetwork) return;

    const updatedNetwork = {
      ...selectedNetwork,
      segments: newSegments,
      updatedAt: new Date().toISOString(),
    };

    setNetworks(prev =>
      prev.map(network =>
        network.id === selectedNetwork.id ? updatedNetwork : network
      )
    );
    setSelectedNetwork(updatedNetwork);
  };

  const handleImport = (importedNetwork: NetworkPlan) => {
    const newNetwork = {
      ...importedNetwork,
      id: Date.now().toString(),
      updatedAt: new Date().toISOString(),
    };
    
    setNetworks(prev => [...prev, newNetwork]);
    setSelectedNetwork(newNetwork);
  };

  const handleUpdateNetworkName = (newName: string) => {
    if (!selectedNetwork || !newName.trim()) return;

    const updatedNetwork = {
      ...selectedNetwork,
      name: newName,
      updatedAt: new Date().toISOString(),
    };

    setNetworks(prev =>
      prev.map(network =>
        network.id === selectedNetwork.id ? updatedNetwork : network
      )
    );
    setSelectedNetwork(updatedNetwork);
    setEditingNetworkName(false);
  };

  const handleDeleteNetwork = (networkId: string) => {
    setNetworks(prev => prev.filter(network => network.id !== networkId));
    if (selectedNetwork?.id === networkId) {
      setSelectedNetwork(null);
    }
  };

  const handleResetNetwork = () => {
    if (!selectedNetwork) return;

    const subnetInfo = calculateSubnetInfo(selectedNetwork.baseNetwork, selectedNetwork.baseNetmask);
    const resetNetwork: NetworkPlan = {
      ...selectedNetwork,
      segments: [{
        name: 'Base Network',
        network: selectedNetwork.baseNetwork,
        netmask: selectedNetwork.baseNetmask,
        gateway: subnetInfo.firstUsable,
        broadcast: subnetInfo.broadcast,
        firstUsable: subnetInfo.firstUsable,
        lastUsable: subnetInfo.lastUsable,
        totalHosts: subnetInfo.totalHosts,
        usableHosts: subnetInfo.usableHosts,
      }],
      updatedAt: new Date().toISOString(),
    };

    setNetworks(prev =>
      prev.map(network =>
        network.id === selectedNetwork.id ? resetNetwork : network
      )
    );
    setSelectedNetwork(resetNetwork);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        handleImport(data);
      } catch (err) {
        alert('Invalid network plan file. Please try again.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2">
            <Network className="h-6 w-6 text-blue-500" />
            <h1 className="text-2xl font-bold text-gray-900">Subnet Planner</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Saved Networks</h2>
              {networks.length === 0 ? (
                <p className="text-gray-500">No networks created yet</p>
              ) : (
                <ul className="space-y-2">
                  {networks.map(network => (
                    <li key={network.id} className="flex items-center justify-between">
                      <button
                        onClick={() => setSelectedNetwork(network)}
                        className={`flex-grow text-left px-4 py-2 rounded-md ${
                          selectedNetwork?.id === network.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {network.name}
                        <div className="text-sm text-gray-500">
                          {network.baseNetwork}/{network.baseNetmask}
                        </div>
                      </button>
                      <button
                        onClick={() => handleDeleteNetwork(network.id)}
                        className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded-md"
                        title="Delete network"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 cursor-pointer w-full">
                  <Upload className="h-4 w-4" />
                  Import Network
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <NetworkForm onSubmit={handleCreateNetwork} />
          </div>

          <div className="lg:col-span-2">
            {selectedNetwork && (
              <>
                <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                  <div className="flex items-center justify-between">
                    {editingNetworkName ? (
                      <input
                        type="text"
                        defaultValue={selectedNetwork.name}
                        onBlur={(e) => handleUpdateNetworkName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateNetworkName(e.currentTarget.value);
                          }
                        }}
                        className="px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold">{selectedNetwork.name}</h2>
                        <button
                          onClick={() => setEditingNetworkName(true)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                        >
                          <Edit2 className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={handleResetNetwork}
                      className="px-3 py-1 text-red-500 hover:bg-red-50 rounded-md flex items-center gap-1"
                      title="Reset to base network"
                    >
                      <Trash2 className="h-4 w-4" />
                      Reset Network
                    </button>
                  </div>
                </div>
                <NetworkActions 
                  network={selectedNetwork}
                  onImport={handleImport}
                />
                <NetworkVisualizer
                  key={selectedNetwork.updatedAt}
                  segments={selectedNetwork.segments}
                  onUpdateSegments={handleUpdateSegments}
                />
              </>
            )}
            {!selectedNetwork && (
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <p className="text-gray-500">Select or create a network to view its details</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;