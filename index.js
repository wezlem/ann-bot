const { Client, Intents, MessageEmbed } = require('discord.js');
const config = require('./config.json');

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_PRESENCES
    ]
});

const prefix = config.prefix;
const statuses = config.statuses;
const timers = config.timers;
const owners = config.owners;

client.on("ready", () => {
    console.log(`Giriş Yapıldı: ${client.user.tag}`);
    // Durumu online (yeşil) olarak ayarla
    client.user.setStatus("online");
    
    const timeing = Math.floor(timers * 1000);
    setInterval(() => {
        const lengthesof = statuses.length;
        const amounter = Math.floor(Math.random() * lengthesof);
        // Aktivite tipini WATCHING (izliyor) olarak ayarla
        client.user.setActivity(statuses[amounter], { type: 'WATCHING' });
    }, timeing);
});

client.on("messageCreate", message => {
    if (message.content.toLowerCase().startsWith(prefix + "help") || 
        message.content.toLowerCase().startsWith(prefix + "yardim")) {
        message.react("💖");
        const help = new MessageEmbed()
            .setTitle("📜 BOT KOMUTLARI")
            .setColor(0x00FF00)
            //.setImage("https://imgur.com/a/NYIwuGb")
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                {
                    name: "🔹 DM Komutları",
                    value: [
                        `\`${prefix}alldm <mesaj>\` - Tüm üyelere DM atar`,
                        `\`${prefix}odm <mesaj>\` - Sadece online üyelere DM atar`,
                        `\`${prefix}roldm @rol <mesaj>\` - Belirli roldeki üyelere DM atar`
                    ].join("\n")
                },
                {
                    name: "🔹 Diğer Komutlar",
                    value: `\`${prefix}ping\` - Bot gecikmesini gösterir`
                }
            )
            .setFooter({ text: `${message.guild.name} • ${new Date().toLocaleString()}` });
        
        message.channel.send({ embeds: [help] });
    }
});

client.on("messageCreate", async message => {
    if (message.content.startsWith(prefix + "odm")) {
        if (!message.member.permissions.has("ADMINISTRATOR")) {
            return message.reply({ 
                content: "❌ Bu komut sadece yöneticiler içindir!",
                ephemeral: true 
            });
        }

        const args = message.content.slice(prefix.length + 3).trim();
        if (!args) {
            return message.reply({
                content: "❌ Mesaj içeriği giriniz! Örnek: `!odm Merhaba!`",
                ephemeral: true
            });
        }

        const loadingMsg = await message.channel.send("⏳ Online üyelere mesaj gönderiliyor...");

        let success = 0, failed = 0, bots = 0;
        const onlineMembers = message.guild.members.cache.filter(m => 
            m.presence?.status !== "offline" && !m.user.bot
        );

        for (const [id, member] of onlineMembers) {
            try {
                const embed = new MessageEmbed()
                    .setTitle("🌐 Online Duyuru")
                    //.setImage("https://imgur.com/a/NYIwuGb")
                    .setDescription(args)
                    .setColor(0x3498DB)
                    .setFooter({ 
                        text: 'wezlem', 
                        iconURL: message.guild.iconURL() 
                    });

                await member.send({ embeds: [embed] });
                success++;
                
                if (success % 5 === 0) await new Promise(r => setTimeout(r, 1000));
            } catch (error) {
                failed++;
                console.error(`[ODM HATA] ${member.user.tag}: ${error.message}`);
            }
        }

        await loadingMsg.delete();

        const result = new MessageEmbed()
            .setTitle("📊 Online DM Sonuçları")
            .setColor(0x00FF00)
            .setDescription([
                `✅ **Başarılı:** ${success} kişi`,
                `❌ **Başarısız:** ${failed} kişi`,
                `🤖 **Botlar:** ${onlineMembers.size - success - failed} atlandı`
            ].join("\n"))
            .setTimestamp();

        await message.channel.send({ embeds: [result] });
    }
});

client.on("messageCreate", async message => {
    if (message.content.startsWith(prefix + "alldm")) {
        if (!message.member.permissions.has("ADMINISTRATOR")) {
            return message.reply({
                content: "❌ Bu komut sadece yöneticiler içindir!",
                ephemeral: true
            });
        }

        const args = message.content.slice(prefix.length + 6).trim();
        if (!args) {
            return message.reply({
                content: "❌ Mesaj içeriği giriniz! Örnek: `!alldm Merhaba!`",
                ephemeral: true
            });
        }

        const loadingMsg = await message.channel.send("⏳ Tüm üyelere mesaj gönderiliyor...");

        let success = 0, failed = 0, bots = 0;
        const allMembers = message.guild.members.cache;

        for (const [id, member] of allMembers) {
            if (member.user.bot) {
                bots++;
                continue;
            }

            try {
                const embed = new MessageEmbed()
                    .setTitle("📢 Sunucu Duyurusu")
                    .setDescription(args)
                    .setColor(0xFFA500)
                    //.setImage("https://imgur.com/a/NYIwuGb")
                    .setFooter({ 
                        text: 'wezlem',
                        iconURL: message.guild.iconURL() 
                    });

                await member.send({ embeds: [embed] });
                success++;
                
                if (success % 5 === 0) await new Promise(r => setTimeout(r, 1000));
            } catch (error) {
                failed++;
                console.error(`[ALLDM HATA] ${member.user.tag}: ${error.message}`);
            }
        }

        await loadingMsg.delete();

        const result = new MessageEmbed()
            .setTitle("📊 Tüm Üyelere DM Sonuçları")
            .setColor(0x00FF00)
            .setDescription([
                `✅ **Başarılı:** ${success} kişi`,
                `❌ **Başarısız:** ${failed} kişi`,
                `🤖 **Botlar:** ${bots} atlandı`
            ].join("\n"))
            .setTimestamp();

        await message.channel.send({ embeds: [result] });
    }
});

client.on("messageCreate", async message => {
    if (message.content.startsWith(prefix + "roldm")) {
        if (!message.member.permissions.has("ADMINISTRATOR")) {
            return message.reply({
                content: "❌ Bu komut sadece yöneticiler içindir!",
                ephemeral: true
            });
        }

        const args = message.content.slice(prefix.length + 6).trim().split(/ +/);
        const role = message.mentions.roles.first();
        const content = args.slice(1).join(" ");

        if (!role) {
            return message.reply({
                content: "❌ Lütfen bir rol etiketleyin! Örnek: `!roldm @Üyeler Merhaba!`",
                ephemeral: true
            });
        }
        if (!content) {
            return message.reply({
                content: "❌ Lütfen mesaj içeriği giriniz!",
                ephemeral: true
            });
        }

        const loadingMsg = await message.channel.send(`⏳ **${role.name}** rolündeki üyelere mesaj gönderiliyor...`);

        let success = 0, failed = 0, bots = 0;
        const roleMembers = role.members;

        for (const [id, member] of roleMembers) {
            if (member.user.bot) {
                bots++;
                continue;
            }

            try {
                const embed = new MessageEmbed()
                    .setTitle(`🎯 ${role.name} Rolüne Özel`)
                    .setDescription(content)
                    .setColor(role.color || 0x5865F2)
                    //.setImage("https://imgur.com/a/NYIwuGb")
                    .setFooter({
                        text: 'wezlem',
                        iconURL: message.guild.iconURL()
                    });

                await member.send({ embeds: [embed] });
                success++;
                
                if (success % 5 === 0) await new Promise(r => setTimeout(r, 1000));
            } catch (error) {
                failed++;
                console.error(`[ROLDM HATA] ${member.user.tag}: ${error.message}`);
            }
        }

        await loadingMsg.delete();

        const result = new MessageEmbed()
            .setTitle("📊 Rol DM Sonuçları")
            .setColor(0x00FF00)
            .setDescription([
                `🎯 **Hedef Rol:** ${role}`,
                `✅ **Başarılı:** ${success} kişi`,
                `❌ **Başarısız:** ${failed} kişi`,
                `🤖 **Botlar:** ${bots} atlandı`
            ].join("\n"))
            .setTimestamp();

        await message.channel.send({ embeds: [result] });
    }
});

client.on("messageCreate", async message => {
    if (message.content.startsWith(prefix + "ping")) {
        const sent = await message.channel.send("🏓 Pinging...");
        const latency = sent.createdTimestamp - message.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);
        
        const embed = new MessageEmbed()
            .setTitle("📶 Bot Gecikme Süreleri")
            .setColor(0x00FF00)
            .addFields(
                { name: "🤖 Bot Gecikmesi", value: `${latency}ms`, inline: true },
                { name: "🌐 API Gecikmesi", value: `${apiLatency}ms`, inline: true }
            )
            .setTimestamp();
        
        await sent.edit({ 
            content: null,
            embeds: [embed] 
        });
    }
});

// Sunucu oluşturma ve proje aktivitesi sağlama.
const express = require('express');
const app = express();
const port = 3000;

// Web sunucu
app.get('/', (req, res) => {
    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Sunucu ${port} numaralı bağlantı noktasında yürütülüyor.`);
});

client.login(process.env.token)
//client.login(config.token);