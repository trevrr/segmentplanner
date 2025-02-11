import React from 'react';
import { Download, Upload, Copy } from 'lucide-react';
import { NetworkPlan, SubnetSegment } from '../types/network';

interface NetworkActionsProps {
  network: NetworkPlan | null;
  onImport: (data: NetworkPlan) => void;
}

export function NetworkActions({ network, onImport }: NetworkActionsProps) {
  const exportToCSV = () => {
    if (!network) return;

    const flattenSegments = (segments: SubnetSegment[], parentName = ''): string[] => {
      const rows: string[] = [];
      segments.forEach(segment => {
        const prefix = parentName ? `${parentName} > ` : '';
        rows.push([
          `"${prefix}${segment.name}"`,
          segment.network,
          segment.netmask,
          segment.gateway,
          segment.broadcast,
          segment.firstUsable,
          segment.lastUsable,
          segment.usableHosts.toString()
        ].join('\t'));

        if (segment.children) {
          rows.push(...flattenSegments(segment.children, `${prefix}${segment.name}`));
        }
      });
      return rows;
    };

    const headers = ['Name', 'Network', 'Netmask', 'Gateway', 'Broadcast', 'First Usable', 'Last Usable', 'Usable Hosts'].join('\t');
    const rows = flattenSegments(network.segments);
    const csv = [headers, ...rows].join('\n');

    // Create a blob and download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${network.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_network_plan.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (!network) return;
    
    const flattenSegments = (segments: SubnetSegment[], parentName = ''): string[] => {
      const rows: string[] = [];
      segments.forEach(segment => {
        const prefix = parentName ? `${parentName} > ` : '';
        rows.push([
          `${prefix}${segment.name}`,
          segment.network,
          segment.netmask,
          segment.gateway,
          segment.broadcast,
          segment.firstUsable,
          segment.lastUsable,
          segment.usableHosts
        ].join('\t'));

        if (segment.children) {
          rows.push(...flattenSegments(segment.children, `${prefix}${segment.name}`));
        }
      });
      return rows;
    };

    const headers = ['Name', 'Network', 'Netmask', 'Gateway', 'Broadcast', 'First Usable', 'Last Usable', 'Usable Hosts'].join('\t');
    const rows = flattenSegments(network.segments);
    const text = [headers, ...rows].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      alert('Network data copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy to clipboard. Please try again.');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        onImport(data);
      } catch (err) {
        alert('Invalid network plan file. Please try again.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex gap-2 mb-4">
      <button
        onClick={exportToCSV}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <Download className="h-4 w-4" />
        Export CSV
      </button>
      
      <button
        onClick={copyToClipboard}
        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      >
        <Copy className="h-4 w-4" />
        Copy to Clipboard
      </button>

      <label className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 cursor-pointer">
        <Upload className="h-4 w-4" />
        Import
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </label>
    </div>
  );
}