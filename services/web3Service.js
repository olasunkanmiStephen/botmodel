import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();


export async function sendTransaction(to, amount) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    const toAddress = ethers.getAddress(to);

    console.log(`\nSender Address: ${wallet.address}`);
    console.log(`Sending ${amount} ETH to ${to}...\n`);

    const tx = await wallet.sendTransaction({
      to,
      value: ethers.parseEther(amount),
    });

    console.log("Transaction submitted!");
    console.log("hash:", tx.hash);

    await tx.wait();
    console.log("transaction confirmed");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

