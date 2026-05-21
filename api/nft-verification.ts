// API Backend pour vérifier les holders NFT et gérer l'accès aux canaux
// À utiliser avec Node.js/Express sur Vercel

const TON_API_KEY = process.env.TON_API_KEY;
const COLLECTION_ADDRESS = process.env.NFT_COLLECTION_ADDRESS;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Structure pour tracker les holders
interface NFTHolder {
    userId: number;
    walletAddress: string;
    nftCount: number;
    nftList: Array<{
        name: string;
        rarity: string;
        tokenId: number;
    }>;
    channelAccess: boolean;
    joinedAt: Date;
}

// Vérifier si un utilisateur possède des NFT
async function checkNFTBalance(walletAddress: string): Promise<NFTHolder | null> {
    try {
        // Appel à l'API TON pour checker les NFT
        const response = await fetch(`https://tonapi.io/v2/accounts/${walletAddress}/nfts`, {
            headers: {
                'Authorization': `Bearer ${TON_API_KEY}`
            }
        });

        if (!response.ok) {
            console.error('Erreur API TON:', response.statusText);
            return null;
        }

        const data = await response.json();
        
        // Filtrer les NFT de la collection Alpha Club
        const alphaNFTs = data.nft_items.filter((nft: any) => 
            nft.collection.address === COLLECTION_ADDRESS
        );

        if (alphaNFTs.length === 0) {
            return null;
        }

        // Créer le profil du holder
        const holder: NFTHolder = {
            userId: 0, // À remplir plus tard
            walletAddress: walletAddress,
            nftCount: alphaNFTs.length,
            nftList: alphaNFTs.map((nft: any) => ({
                name: nft.metadata?.name || 'NFT',
                rarity: nft.metadata?.attributes?.rarity || 'Unknown',
                tokenId: nft.index
            })),
            channelAccess: true,
            joinedAt: new Date()
        };

        return holder;
    } catch (error) {
        console.error('Erreur vérification NFT:', error);
        return null;
    }
}

// Ajouter l'utilisateur au canal privé
async function addUserToPrivateChannel(userId: number, username: string): Promise<boolean> {
    try {
        // Générer un lien d'invitation pour le canal privé
        const inviteLink = `https://t.me/+AlphaClubPrivate_${userId}`;
        
        // Envoyer un message à l'utilisateur
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: userId,
                text: `🎉 Bienvenue ! Vous avez accès au canal privé exclusif Alpha Club\n\n🔗 Rejoignez-nous : ${inviteLink}`,
                parse_mode: 'HTML'
            })
        });

        return true;
    } catch (error) {
        console.error('Erreur ajout canal:', error);
        return false;
    }
}

// Endpoint pour vérifier l'accès
export async function verifyNFTAccess(req: any, res: any) {
    const { userId, walletAddress } = req.body;

    if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address required' });
    }

    const holder = await checkNFTBalance(walletAddress);

    if (!holder) {
        return res.status(403).json({ 
            error: 'No NFT found',
            message: 'Vous devez posséder au moins 1 NFT Alpha Club'
        });
    }

    // Ajouter au canal privé
    const added = await addUserToPrivateChannel(userId, '');

    res.json({
        success: true,
        nftCount: holder.nftCount,
        nftList: holder.nftList,
        channelAccess: holder.channelAccess,
        privateChannelAdded: added
    });
}

// Endpoint pour les offres exclusives
export async function getExclusiveOffers(req: any, res: any) {
    const { walletAddress } = req.body;

    const holder = await checkNFTBalance(walletAddress);

    if (!holder) {
        return res.status(403).json({ error: 'Not an NFT holder' });
    }

    // Offres basées sur la rareté
    const offers = {
        Rare: [
            {
                id: 1,
                name: 'Produit Rare',
                discount: '10%',
                price: 'À partir de 4.99€'
            }
        ],
        Épique: [
            {
                id: 2,
                name: 'Abonnement VIP',
                discount: '20%',
                price: 'À partir de 9.99€'
            }
        ],
        Légendaire: [
            {
                id: 3,
                name: 'Accès Lifetime',
                discount: '50%',
                price: 'À partir de 49.99€'
            }
        ]
    };

    // Récupérer les raretés de l'utilisateur
    const rarities = holder.nftList.map(nft => nft.rarity);
    const uniqueRarities = [...new Set(rarities)];

    let exclusiveOffers: any[] = [];
    uniqueRarities.forEach(rarity => {
        if (offers[rarity as keyof typeof offers]) {
            exclusiveOffers = [...exclusiveOffers, ...offers[rarity as keyof typeof offers]];
        }
    });

    res.json({
        success: true,
        nftCount: holder.nftCount,
        offers: exclusiveOffers,
        yourRarities: uniqueRarities
    });
}

export default {
    verifyNFTAccess,
    getExclusiveOffers
};
