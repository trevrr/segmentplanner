export interface SubnetSegment {
  name: string;
  network: string;
  netmask: string;
  gateway: string;
  broadcast: string;
  firstUsable: string;
  lastUsable: string;
  totalHosts: number;
  usableHosts: number;
  children?: SubnetSegment[];
}

export interface NetworkPlan {
  id: string;
  name: string;
  baseNetwork: string;
  baseNetmask: string;
  segments: SubnetSegment[];
  createdAt: string;
  updatedAt: string;
}