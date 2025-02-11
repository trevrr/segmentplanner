import React, { useState } from 'react';
import { Network, Plus, PencilLine, Trash2 } from 'lucide-react';
import { SubnetSegment } from '../types/network';
import { splitSubnet, netmaskToCIDR, cidrToNetmask, calculateSubnetInfo, isValidIPv4 } from '../utils/networkUtils';

interface NetworkVisualizerProps {
  segments: SubnetSegment[];
  onUpdateSegments: (segments: SubnetSegment[]) => void;
}

export function NetworkVisualizer({ segments, onUpdateSegments }: NetworkVisualizerProps) {
  const [splitCIDR, setSplitCIDR] = useState<number | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [editingSegment, setEditingSegment] = useState<string | null>(null);
  const [customSubnet, setCustomSubnet] = useState('');
  const [customNetmask, setCustomNetmask] = useState('');
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState('');

  // Helper function to generate a unique segment identifier
  const getSegmentId = (segment: SubnetSegment): string => {
    return `${segment.network}-${segment.netmask}-${segment.name}`;
  };

  const handleSplitSubnet = (segment: SubnetSegment) => {
    if (customSubnet && customNetmask) {
      // Custom subnet creation
      if (!isValidIPv4(customSubnet) || !isValidIPv4(customNetmask)) {
        setError('Invalid IP address format');
        return;
      }

      const info = calculateSubnetInfo(customSubnet, customNetmask);
      const newSegment: SubnetSegment = {
        name: customName || 'Custom Subnet',
        network: customSubnet,
        netmask: customNetmask,
        gateway: info.firstUsable,
        broadcast: info.broadcast,
        firstUsable: info.firstUsable,
        lastUsable: info.lastUsable,
        totalHosts: info.totalHosts,
        usableHosts: info.usableHosts,
      };

      // Update segments recursively, matching by unique segment ID
      const updateSegmentsRecursively = (segs: SubnetSegment[]): SubnetSegment[] => {
        return segs.map(seg => {
          if (getSegmentId(seg) === getSegmentId(segment)) {
            return {
              ...seg,
              children: seg.children ? [...seg.children, newSegment] : [newSegment]
            };
          }
          if (seg.children) {
            return { ...seg, children: updateSegmentsRecursively(seg.children) };
          }
          return seg;
        });
      };

      onUpdateSegments(updateSegmentsRecursively(segments));
      setCustomSubnet('');
      setCustomNetmask('');
      setCustomName('');
      setError('');
    } else if (splitCIDR) {
      // Automatic CIDR-based splitting
      const currentCIDR = netmaskToCIDR(segment.netmask);
      const newSubnets = splitSubnet(segment.network, currentCIDR, splitCIDR);
      
      if (newSubnets.length === 0) return;

      const newNetmask = cidrToNetmask(splitCIDR);
      const childSegments: SubnetSegment[] = newSubnets.map((subnet, index) => {
        const info = calculateSubnetInfo(subnet, newNetmask);
        return {
          name: `Subnet ${index + 1}`,
          network: subnet,
          netmask: newNetmask,
          gateway: info.firstUsable,
          broadcast: info.broadcast,
          firstUsable: info.firstUsable,
          lastUsable: info.lastUsable,
          totalHosts: info.totalHosts,
          usableHosts: info.usableHosts,
        };
      });

      // Update segments recursively, matching by unique segment ID
      const updateSegmentsRecursively = (segs: SubnetSegment[]): SubnetSegment[] => {
        return segs.map(seg => {
          if (getSegmentId(seg) === getSegmentId(segment)) {
            return { ...seg, children: seg.children ? [...seg.children, ...childSegments] : childSegments };
          }
          if (seg.children) {
            return { ...seg, children: updateSegmentsRecursively(seg.children) };
          }
          return seg;
        });
      };

      onUpdateSegments(updateSegmentsRecursively(segments));
    }
    setSelectedSegment(null);
    setSplitCIDR(null);
  };

  // Handle segment name update using unique segment ID
  const handleUpdateSegmentName = (segment: SubnetSegment, newName: string) => {
    if (!newName.trim()) return;

    const updateSegmentsRecursively = (segs: SubnetSegment[]): SubnetSegment[] => {
      return segs.map(seg => {
        if (getSegmentId(seg) === getSegmentId(segment)) {
          return { ...seg, name: newName };
        }
        if (seg.children) {
          return { ...seg, children: updateSegmentsRecursively(seg.children) };
        }
        return seg;
      });
    };

    const updatedSegments = updateSegmentsRecursively(segments);
    onUpdateSegments(updatedSegments);
    setEditingSegment(null);
  };

  // Handle segment deletion using unique segment ID
  const handleDeleteSegment = (segment: SubnetSegment) => {
    const deleteSegmentRecursively = (segs: SubnetSegment[]): SubnetSegment[] => {
      return segs.filter(seg => getSegmentId(seg) !== getSegmentId(segment))
        .map(seg => {
          if (seg.children) {
            return { ...seg, children: deleteSegmentRecursively(seg.children) };
          }
          return seg;
        });
    };

    onUpdateSegments(deleteSegmentRecursively(segments));
  };

  const renderSegment = (segment: SubnetSegment, depth: number = 0) => {
    const paddingLeft = depth * 20;
    const currentCIDR = netmaskToCIDR(segment.netmask);
    // Use unique segment ID for selection and editing states
    const segmentId = getSegmentId(segment);
    const isSelected = selectedSegment === segmentId;
    const isEditing = editingSegment === segmentId;

    return (
      <div 
        key={segmentId}
        className="relative"
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        <div className={`bg-white p-4 rounded-lg shadow-md mb-4 border-l-4 ${
          isSelected ? 'border-green-500' : 'border-blue-500'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Network className="text-blue-500" />
              {isEditing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.querySelector('input');
                    if (input) {
                      handleUpdateSegmentName(segment, input.value);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    defaultValue={segment.name}
                    onBlur={(e) => handleUpdateSegmentName(segment, e.target.value)}
                    className="px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{segment.name}</h3>
                  {/* Edit button - triggers name editing for the specific segment */}
                  <button
                    onClick={() => setEditingSegment(segmentId)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200"
                    title="Edit subnet name"
                  >
                    <PencilLine className="h-4 w-4 text-gray-500 hover:text-blue-500" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {depth > 0 && (
                // Delete button - removes the specific segment
                <button
                  onClick={() => handleDeleteSegment(segment)}
                  className="p-1 rounded-full hover:bg-red-100"
                  title="Delete subnet"
                >
                  <Trash2 className="h-5 w-5 text-red-500" />
                </button>
              )}
              {/* Split button - toggles subnet splitting UI for the specific segment */}
              <button
                onClick={() => setSelectedSegment(isSelected ? null : segmentId)}
                className="p-1 rounded-full hover:bg-gray-100"
                title="Split subnet"
              >
                <Plus className="h-5 w-5 text-blue-500" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Network:</span> {segment.network}/{currentCIDR}
            </div>
            <div>
              <span className="text-gray-600">Netmask:</span> {segment.netmask}
            </div>
            <div>
              <span className="text-gray-600">Gateway:</span> {segment.gateway}
            </div>
            <div>
              <span className="text-gray-600">Broadcast:</span> {segment.broadcast}
            </div>
            <div>
              <span className="text-gray-600">Usable Range:</span>
              <div className="text-xs">
                {segment.firstUsable} - {segment.lastUsable}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Hosts:</span> {segment.usableHosts}
            </div>
          </div>

          {isSelected && (
            <div className="mt-4 space-y-4">
              <div className="bg-gray-50 rounded-md p-4">
                <h4 className="font-medium mb-2">Add Custom Subnet</h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Subnet Name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Network (e.g., 192.168.1.0)"
                    value={customSubnet}
                    onChange={(e) => setCustomSubnet(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Netmask (e.g., 255.255.255.0)"
                    value={customNetmask}
                    onChange={(e) => setCustomNetmask(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-md p-4">
                <h4 className="font-medium mb-2">Or Split by CIDR</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={currentCIDR + 1}
                    max="32"
                    value={splitCIDR || ''}
                    onChange={(e) => setSplitCIDR(parseInt(e.target.value, 10))}
                    className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="CIDR"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <button
                onClick={() => handleSplitSubnet(segment)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add Subnet
              </button>
            </div>
          )}

          <div className="mt-4 h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{
                width: `${(segment.usableHosts / segments[0].usableHosts) * 100}%`,
              }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1 text-center">
            {((segment.usableHosts / segments[0].usableHosts) * 100).toFixed(1)}% of parent network
          </div>
        </div>
        
        {segment.children && (
          <div className="ml-8 border-l-2 border-dashed border-gray-300">
            {segment.children.map(child => renderSegment(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      {segments.map(segment => renderSegment(segment))}
    </div>
  );
}