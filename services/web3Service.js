import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

export async function sendTransaction(to, amount) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // Validate recipient address
    try {
      ethers.getAddress(to);
    } catch (err) {
      const msg = `Invalid Ethereum address provided: ${to}`;
      console.error(msg);
      return { error: msg };
    }

    console.log(`\nSender Address: ${wallet.address}`);
    console.log(`Sending ${amount} ETH to ${to}...\n`);

    let tx, receipt;

    // ✅ Isolate transaction send/wait errors
    try {
      tx = await wallet.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });

      console.log("Transaction submitted!");
      console.log("hash:", tx.hash);

      receipt = await tx.wait();
      console.log("Transaction confirmed");

      return { hash: tx.hash, receipt };
    } catch (error) {
      let errMsg = error?.reason || error?.message || "Transaction failed";

      if (errMsg.includes("insufficient funds")) {
        errMsg = `Transaction failed: insufficient funds. Your wallet may not have enough ETH to cover ${amount} ETH + gas fees.`;
      }

      console.error("Transaction Error:", errMsg);
      return { error: errMsg };
    }
  } catch (error) {
    // Fallback for unexpected issues
    const errMsg = error?.message || "Unexpected error while preparing transaction";
    console.error("General Error:", errMsg);
    return { error: errMsg };
  }
}
