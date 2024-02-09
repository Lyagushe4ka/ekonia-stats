import { add, getMonth, getWeek, parseISO } from 'date-fns';
import got from 'got';
import * as fs from 'fs';

type Order = {
  market_id: number;
  created_at: string;
  last_updated_at: string;
  user: string;
};

type Stats = {
  address: string;
  days: number;
  weeks: number;
  months: number;
  totalOrders: number;
};

async function parseAddress(address: string): Promise<Stats> {

  const uniqueDays = new Set();
  const uniqueWeeks = new Set();
  const uniqueMonths = new Set();

  const orders = await got.get('https://aptos-mainnet-econia.nodeinfra.com/orders', {
    searchParams: {
      user: `eq.${address}`,
      order_status: 'eq.closed',
    },
  }).json() as Order[];

  orders.forEach((item: Order) => {
    const date = parseISO(item.last_updated_at);
    const dataString = item.last_updated_at.split('T')[0];

    uniqueDays.add(dataString);
    uniqueWeeks.add(getWeek(date));
    uniqueMonths.add(getMonth(date));
  });

  // console.log('Wallet address:', address);
  // console.log('Unique Days:', uniqueDays.size);
  // console.log('Unique Weeks:', uniqueWeeks.size);
  // console.log('Unique Months:', uniqueMonths.size);
  // console.log('Total Orders:', orders.length);
  // console.log('-'.repeat(83));

  return {
    address,
    days: uniqueDays.size,
    weeks: uniqueWeeks.size,
    months: uniqueMonths.size,
    totalOrders: orders.length,
  }
}

async function parse() {
  const parsedWallets = fs.readFileSync('wallets.txt', 'utf-8').replaceAll('\r', '').split('\n');

  let wallets: string[] = [];
  parsedWallets.forEach((wallet) => {
    if (wallet.length > 0 && wallet.startsWith('0x')) {
      wallets.push(trimZeroes(wallet.trim()));
    }
  });

  let results: Stats[] = [];

  for (const wallet of wallets) {
    const result = await parseAddress(wallet);
    results.push(result);
  }
  
  console.table(results);

}

const trimZeroes = (address: string): string => {
  return address.replace(/^0x0+/, '0x');
}

parse();
