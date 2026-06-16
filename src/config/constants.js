// src/config/constants.js

// AMAN: Mengambil dari environment variable, fallback ke undefined
// Gunakan ini untuk data yang bersifat rahasia (Project ID, API Key)
export const WC_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

export const TEQOIN_CHAIN = {
  chainId: "0x66a19",
  chainIdDec: 420377,
  chainName: "TeQoin L2",
  rpcUrl: "https://rpc.teqoin.io",
  symbol: "ETH",
  blockExplorer: "https://explorer.teqoin.io/",
};

export const ROUTER_ADDRESS = "0x96364A65354AbF7fa7bF8F1B6197822670f320e6";
export const WTEQ_ADDRESS = "0x5E9D1C4ba94E4D078b5568B41b276fC9191AbAdb";

export const TOKENS = [
  { symbol: "ETH", name: "Ether", address: "native", decimals: 18, color: "#627eea", bg: "#1a1f4e" },
  { symbol: "TEQ", name: "TeQoin", address: "0x49c2E9438Be52b88830802D7073831c1b83EcD28", decimals: 18, color: "#00ff41", bg: "#001a0d" },
  { symbol: "USDT", name: "Tether USD", address: "0xfcc025a3e170df62de0e25af7ceaf1c89abfe6e9", decimals: 6, color: "#26a17b", bg: "#001a12" },
  { symbol: "USDC", name: "USD Coin", address: "0xe819eb5be34b20f1fec012c0daf960397a0fb386", decimals: 6, color: "#2775ca", bg: "#001229" },
  { symbol: "DAI", name: "DAI", address: "0xb96a869c74be2ed561d95a77408505371f287d16", decimals: 18, color: "#f7931a", bg: "#1f1000" }, // Perbaikan: DAI biasanya 18 desimal
  { symbol: "WTEQ", name: "WTEQ", address: "0x5E9D1C4ba94E4D078b5568B41b276fC9191AbAdb", decimals: 18, color: "#ff0062", bg: "#1f0010" },
];

export const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
];

export const ERC20_ABI = [
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
];

export const POOL_PAIRS = [
  { a: TOKENS[1], b: TOKENS[2] },
  { a: TOKENS[0], b: TOKENS[1] },
  { a: TOKENS[1], b: TOKENS[5] },
  { a: TOKENS[2], b: TOKENS[3] },
];

// Utility functions
export const shortAddr = (a) => (a && a !== "native" ? `${a.slice(0, 6)}…${a.slice(-4)}` : "native");

export const fmtN = (n, d = 4) => {
  const x = parseFloat(n);
  if (!n || isNaN(x)) return "0";
  return x < 0.0001 ? "<0.0001" : x.toLocaleString("en-US", { maximumFractionDigits: d });
};

export const buildPath = (tIn, tOut) => {
  const addrIn = tIn.address === "native" ? WTEQ_ADDRESS : tIn.address;
  const addrOut = tOut.address === "native" ? WTEQ_ADDRESS : tOut.address;
  return (addrIn === WTEQ_ADDRESS || addrOut === WTEQ_ADDRESS) 
    ? [addrIn, addrOut] 
    : [addrIn, WTEQ_ADDRESS, addrOut];
};

export const swapDeadline = () => Math.floor(Date.now() / 1000) + 1200;