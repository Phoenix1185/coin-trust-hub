import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Network {
  value: string;
  label: string;
}

const USDT_NETWORKS: Network[] = [
  { value: "ERC20", label: "Ethereum (ERC20)" },
  { value: "TRC20", label: "Tron (TRC20)" },
  { value: "BEP20", label: "BSC (BEP20)" },
  { value: "POLYGON", label: "Polygon" },
  { value: "ARBITRUM", label: "Arbitrum" },
  { value: "OPTIMISM", label: "Optimism" },
  { value: "SOLANA", label: "Solana" },
];

const USDC_NETWORKS: Network[] = [
  { value: "ERC20", label: "Ethereum (ERC20)" },
  { value: "BEP20", label: "BSC (BEP20)" },
  { value: "POLYGON", label: "Polygon" },
  { value: "ARBITRUM", label: "Arbitrum" },
  { value: "OPTIMISM", label: "Optimism" },
  { value: "SOLANA", label: "Solana" },
  { value: "BASE", label: "Base" },
];

interface NetworkSelectorProps {
  type: "USDT" | "USDC";
  selectedNetwork: string;
  onNetworkChange: (network: string) => void;
  address: string;
  onAddressChange: (address: string) => void;
  disabled?: boolean;
}

export const NetworkSelector = ({
  type,
  selectedNetwork,
  onNetworkChange,
  address,
  onAddressChange,
  disabled = false,
}: NetworkSelectorProps) => {
  const networks = type === "USDT" ? USDT_NETWORKS : USDC_NETWORKS;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${type}-network`}>Select Network</Label>
        <Select value={selectedNetwork} onValueChange={onNetworkChange} disabled={disabled}>
          <SelectTrigger id={`${type}-network`}>
            <SelectValue placeholder="Select a network" />
          </SelectTrigger>
          <SelectContent>
            {networks.map((network) => (
              <SelectItem key={network.value} value={network.value}>
                {network.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${type}-address`}>{type} Address ({selectedNetwork || "Select network"})</Label>
        <Input
          id={`${type}-address`}
          type="text"
          placeholder={`Enter your ${type} ${selectedNetwork || ""} address`}
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          disabled={disabled || !selectedNetwork}
        />
      </div>
    </div>
  );
};

export default NetworkSelector;
