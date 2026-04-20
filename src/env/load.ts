import { config } from 'dotenv';
import { existsSync } from 'node:fs';

export type Network = 'devnet' | 'mainnet-beta';

/**
 * Load the correct .env file for the given network.
 * Mainnet additionally requires CONFIRM_MAINNET === "yes-mainnet-ceremony" — any other value aborts.
 */
export function loadEnv(network: Network): void {
  const file = network === 'mainnet-beta' ? '.env.mainnet' : '.env.devnet';
  if (!existsSync(file)) {
    throw new Error(`${file} not found — copy ${file}.example to ${file} and fill values.`);
  }
  config({ path: file });
  if (network === 'mainnet-beta') {
    const confirm = process.env.CONFIRM_MAINNET;
    if (confirm !== 'yes-mainnet-ceremony') {
      throw new Error(
        `CONFIRM_MAINNET must be exactly "yes-mainnet-ceremony" for mainnet operations. ` +
          `Got: "${confirm ?? 'unset'}". Refusing to proceed.`,
      );
    }
  }
}
