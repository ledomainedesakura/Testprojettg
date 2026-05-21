// Smart Contract TON pour NFT Alpha Club
// Utilise TON NFT Standard (TEP-62)

import { Contract, ContractProvider, Sender, Cell, beginCell } from '@ton/ton';

export class AlphaClubNFT extends Contract {
    static readonly opcodes = {
        transfer: 0x5fcc3d14,
        getStaticData: 0x2fcb26a2,
    };

    constructor(address: Address, init?: { code: Cell; data: Cell }) {
        super(address, init);
    }

    static createFromAddress(address: Address) {
        return new AlphaClubNFT(address);
    }

    static createFromConfig(config: AlphaClubNFTConfig, code: Cell, workchain = 0) {
        const data = AlphaClubNFT.dataCell(config);
        const init = { code, data };
        return new AlphaClubNFT(contractAddress(workchain, init), init);
    }

    private static dataCell(config: AlphaClubNFTConfig) {
        return beginCell()
            .storeUint(config.index, 256)
            .storeAddress(config.collectionAddress)
            .storeAddress(config.ownerAddress)
            .storeRef(config.content)
            .endCell();
    }

    async getGetStaticData(provider: ContractProvider) {
        const result = await provider.get('get_static_data', []);
        return {
            index: result.stack.readBigNumber(),
            collectionAddress: result.stack.readAddress(),
        };
    }
}

export interface AlphaClubNFTConfig {
    index: number;
    collectionAddress: Address;
    ownerAddress: Address;
    content: Cell;
}

// Métadonnées NFT
export interface NFTMetadata {
    name: string;
    description: string;
    image: string;
    rarity: 'Rare' | 'Épique' | 'Légendaire';
    attributes: {
        bonus: string;
        discount?: string;
    };
}

// Collection Master Contract
export const nftCollectionABI = {
    types: {
        StateInit: {
            code: 'Cell',
            data: 'Cell'
        }
    },
    getters: {
        get_collection_data: {
            returns: {
                next_item_index: 'Int',
                content: 'Cell',
                owner_address: 'Address'
            }
        },
        royalty_params: {
            returns: {
                numerator: 'Int',
                denominator: 'Int',
                destination: 'Address'
            }
        }
    },
    messages: {
        Mint: {
            body: {
                to: 'Address',
                item_index: 'Int',
                amount: 'Coins',
                content: 'Cell'
            }
        }
    }
};

export const NFT_ITEMS = {
    dragon_gold: {
        id: 0,
        name: 'Dragon Gold',
        emoji: '🐉',
        price: '0.5',
        rarity: 'Légendaire',
        bonus: '+10% récompenses',
        discount: null
    },
    phoenix_fire: {
        id: 1,
        name: 'Phoenix Fire',
        emoji: '🔥',
        price: '0.25',
        rarity: 'Épique',
        bonus: 'Accès prioritaire',
        discount: '5%'
    },
    cyber_wolf: {
        id: 2,
        name: 'Cyber Wolf',
        emoji: '🐺',
        price: '0.1',
        rarity: 'Rare',
        bonus: 'Accès boutique',
        discount: null
    },
    space_hawk: {
        id: 3,
        name: 'Space Hawk',
        emoji: '🦅',
        price: '0.15',
        rarity: 'Rare',
        bonus: 'Bonus spécial',
        discount: null
    }
};
