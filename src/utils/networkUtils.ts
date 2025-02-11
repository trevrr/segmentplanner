export function isValidIPv4(ip: string): boolean {
  const pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!pattern.test(ip)) return false;
  
  const parts = ip.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}

export function isValidCIDR(cidr: string): boolean {
  const parts = cidr.split('/');
  if (parts.length !== 2) return false;
  
  const prefix = parseInt(parts[1], 10);
  return isValidIPv4(parts[0]) && prefix >= 0 && prefix <= 32;
}

export function netmaskToCIDR(netmask: string): number {
  const parts = netmask.split('.').map(Number);
  let count = 0;
  for (const part of parts) {
    count += (part >>> 0).toString(2).split('0').join('').length;
  }
  return count;
}

export function cidrToNetmask(cidr: number): string {
  const mask = ~((1 << (32 - cidr)) - 1);
  return [
    (mask >>> 24) & 255,
    (mask >>> 16) & 255,
    (mask >>> 8) & 255,
    mask & 255,
  ].join('.');
}

export function calculateSubnetInfo(network: string, netmask: string): {
  network: string;
  broadcast: string;
  firstUsable: string;
  lastUsable: string;
  totalHosts: number;
  usableHosts: number;
  cidr: number;
} {
  const networkParts = network.split('.').map(Number);
  const maskParts = netmask.split('.').map(Number);
  
  const cidr = netmaskToCIDR(netmask);
  const totalHosts = Math.pow(2, 32 - cidr);
  const usableHosts = Math.max(totalHosts - 2, 0);

  // Calculate network boundaries
  const networkNum = networkParts.reduce((acc, part) => (acc << 8) + part, 0);
  const maskNum = maskParts.reduce((acc, part) => (acc << 8) + part, 0);
  const broadcastNum = networkNum | (~maskNum >>> 0);

  const firstUsableNum = networkNum + 1;
  const lastUsableNum = broadcastNum - 1;

  const numToIp = (num: number) => [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join('.');

  return {
    network,
    broadcast: numToIp(broadcastNum),
    firstUsable: numToIp(firstUsableNum),
    lastUsable: numToIp(lastUsableNum),
    totalHosts,
    usableHosts,
    cidr
  };
}

export function splitSubnet(network: string, currentCIDR: number, newCIDR: number): string[] {
  if (newCIDR <= currentCIDR) return [];
  
  const networkParts = network.split('.').map(Number);
  const networkNum = networkParts.reduce((acc, part) => (acc << 8) + part, 0);
  const numSubnets = Math.pow(2, newCIDR - currentCIDR);
  const subnetSize = Math.pow(2, 32 - newCIDR);
  
  return Array.from({ length: numSubnets }, (_, i) => {
    const subnetNum = networkNum + (i * subnetSize);
    return [
      (subnetNum >>> 24) & 255,
      (subnetNum >>> 16) & 255,
      (subnetNum >>> 8) & 255,
      subnetNum & 255,
    ].join('.');
  });
}