// Bot Telegram pour gérer l'accès aux canaux NFT et les offres exclusives
// Utilise node-telegram-bot-api

const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const COLLECTION_ADDRESS = process.env.NFT_COLLECTION_ADDRESS;
const PUBLIC_CHANNEL_ID = process.env.PUBLIC_CHANNEL_ID; // @AlphaClubPublic
const PRIVATE_CHANNEL_ID = process.env.PRIVATE_CHANNEL_ID; // Groupe privé
const ADMIN_ID = process.env.ADMIN_ID;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Base de données des holders (à remplacer par une vraie DB)
const holders = new Map();

// Commande /start - Menu principal
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🛍️ Vérifier mes NFT', callback_data: 'check_nft' }],
                [{ text: '💰 Offres Exclusives', callback_data: 'exclusive_offers' }],
                [{ text: '🏘️ Rejoindre Communauté', callback_data: 'join_community' }],
                [{ text: '📖 À propos', callback_data: 'about' }]
            ]
        }
    };

    bot.sendMessage(chatId, 
        '🎮 <b>Bienvenue dans Alpha Club</b>\n\n' +
        'Connectez votre wallet pour accéder aux avantages exclusifs des holders de NFT!\n\n' +
        '✨ <b>Avantages:</b>\n' +
        '• Accès au canal communauté privé\n' +
        '• Offres et produits exclusifs\n' +
        '• Abonnements VIP\n' +
        '• Événements spéciaux',
        { parse_mode: 'HTML', ...keyboard }
    );
});

// Gérer les clics sur les boutons
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const action = query.data;

    try {
        if (action === 'check_nft') {
            await handleCheckNFT(chatId, userId);
        } else if (action === 'exclusive_offers') {
            await handleExclusiveOffers(chatId, userId);
        } else if (action === 'join_community') {
            await handleJoinCommunity(chatId, userId);
        } else if (action === 'about') {
            await handleAbout(chatId);
        }
    } catch (error) {
        console.error('Erreur callback:', error);
        bot.sendMessage(chatId, '❌ Une erreur s\'est produite');
    }

    bot.answerCallbackQuery(query.id);
});

// Vérifier les NFT de l'utilisateur
async function handleCheckNFT(chatId, userId) {
    bot.sendMessage(chatId, 
        '⏳ Vérification de vos NFT...\n\n' +
        'Connectez votre wallet:\n' +
        '/wallet <adresse_wallet>'
    );
}

// Afficher les offres exclusives
async function handleExclusiveOffers(chatId, userId) {
    const holder = holders.get(userId);

    if (!holder) {
        bot.sendMessage(chatId,
            '❌ Veuillez d\'abord vérifier vos NFT\n' +
            '/wallet <adresse_wallet>'
        );
        return;
    }

    const offers = getOffersForRarities(holder.rarities);
    
    let message = `💝 <b>Offres Exclusives pour ${holder.nftCount} NFT(s)</b>\n\n`;
    
    offers.forEach(offer => {
        message += `<b>${offer.name}</b>\n`;
        message += `Réduction: <b>${offer.discount}</b>\n`;
        message += `Prix: ${offer.price}\n\n`;
    });

    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🛒 Voir la boutique', url: 'https://testprojettg.vercel.app' }],
                [{ text: '🔙 Retour', callback_data: 'start' }]
            ]
        }
    };

    bot.sendMessage(chatId, message, { parse_mode: 'HTML', ...keyboard });
}

// Rejoindre la communauté
async function handleJoinCommunity(chatId, userId) {
    const holder = holders.get(userId);

    if (!holder || !holder.hasNFT) {
        bot.sendMessage(chatId,
            '❌ Seuls les holders de NFT peuvent accéder à la communauté\n\n' +
            'Vérifiez d\'abord vos NFT:\n' +
            '/wallet <adresse_wallet>'
        );
        return;
    }

    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🌐 Canal Public (Partages)', callback_data: 'join_public' }],
                [{ text: '🔒 Canal Privé (Exclusif)', callback_data: 'join_private' }],
                [{ text: '🔙 Retour', callback_data: 'start' }]
            ]
        }
    };

    bot.sendMessage(chatId,
        '<b>Rejoindre la Communauté</b>\n\n' +
        '🌐 <b>Canal Public:</b>\n' +
        'Partagez vos expériences avec les NFT\n\n' +
        '🔒 <b>Canal Privé:</b>\n' +
        'Accès exclusif aux holders',
        { parse_mode: 'HTML', ...keyboard }
    );
}

// À propos
async function handleAbout(chatId) {
    bot.sendMessage(chatId,
        '<b>À propos d\'Alpha Club</b>\n\n' +
        '🎮 La première plateforme NFT gaming sur Telegram\n\n' +
        '<b>Nos NFT:</b>\n' +
        '🐉 Dragon Gold (Légendaire)\n' +
        '🔥 Phoenix Fire (Épique)\n' +
        '🐺 Cyber Wolf (Rare)\n' +
        '🦅 Space Hawk (Rare)\n\n' +
        '<b>Avantages des holders:</b>\n' +
        '✨ +10% récompenses\n' +
        '💰 Accès prioritaire\n' +
        '🎁 Offres exclusives\n\n' +
        '📧 Contact: support@alphaclub.com',
        { parse_mode: 'HTML' }
    );
}

// Récupérer les offres basées sur les raretés
function getOffersForRarities(rarities) {
    const offers = {
        'Rare': [
            { name: '🎁 Produit Rare', discount: '10%', price: 'À partir de 4.99€' }
        ],
        'Épique': [
            { name: '⭐ Abonnement VIP', discount: '20%', price: 'À partir de 9.99€' }
        ],
        'Légendaire': [
            { name: '👑 Accès Lifetime', discount: '50%', price: 'À partir de 49.99€' }
        ]
    };

    let result = [];
    rarities.forEach(rarity => {
        if (offers[rarity]) {
            result = [...result, ...offers[rarity]];
        }
    });

    return result;
}

// Commande /wallet pour connecter le wallet
bot.onText(/\/wallet (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const walletAddress = match[1].trim();

    bot.sendMessage(chatId, '⏳ Vérification du wallet...');

    try {
        // Appel à l'API de vérification
        const response = await fetch('https://testprojettg.vercel.app/api/nft-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, walletAddress })
        });

        const result = await response.json();

        if (result.success) {
            const nftList = result.nftList.map(nft => 
                `• ${nft.name} (${nft.rarity})`
            ).join('\n');

            holders.set(userId, {
                walletAddress,
                nftCount: result.nftCount,
                rarities: result.nftList.map(n => n.rarity),
                hasNFT: true
            });

            bot.sendMessage(chatId,
                `✅ <b>Wallet Connecté!</b>\n\n` +
                `<b>NFT trouvés: ${result.nftCount}</b>\n\n` +
                nftList +
                `\n\n🎉 Vous avez accès aux offres exclusives!`,
                { parse_mode: 'HTML' }
            );
        } else {
            bot.sendMessage(chatId,
                '❌ Aucun NFT Alpha Club trouvé\n' +
                'Achetez des NFT pour accéder aux avantages exclusifs'
            );
        }
    } catch (error) {
        console.error('Erreur wallet:', error);
        bot.sendMessage(chatId, '❌ Erreur lors de la vérification du wallet');
    }
});

// Gestion des erreurs
bot.on('polling_error', (error) => {
    console.error('Erreur polling:', error);
});

module.exports = bot;
