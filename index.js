const { Client, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const { getDocs, collection, query, where } = require('firebase/firestore');
const { db } = require('./firebase')

require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const rest = new REST({ version: '9' }).setToken(process.env.token);

const commands = [
    new SlashCommandBuilder()
        .setName('tugas')
        .setDescription('Menampilkan tugas dengan deadline tanggal (format: YYYY-MM-DD)')
        .addStringOption(option =>
            option.setName('tanggal')
                .setDescription('Tanggal deadline tugas (format: YYYY-MM-DD)')
                .setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('tugas-besok')
        .setDescription('Menampilkan tugas yang harus dilakukan besok.'),
    new SlashCommandBuilder()
        .setName('list-tugas')
        .setDescription('Menampilkan daftar tugas yang perlu dikerjakan.'),
].map(command => command.toJSON());

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(process.env.clientId, process.env.guildId),
            { body: commands },
        );

        console.log('Successfully registered application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'tugas') {
        const tanggal = options.getString('tanggal');

        if (!tanggal) {
            await interaction.reply('🔴 Mohon masukkan tanggal dengan format YYYY-MM-DD.');
            return;
        }

        const tugasQuery = query(
            collection(db, 'tugas_h'),
            where('deadline', '==', tanggal)
        );

        const get = await getDocs(tugasQuery);
        const tempData = [];

        get.forEach((data) => {
            tempData.push({ ...data.data(), id: data.id });
        });

        if (tempData.length === 0) {
            await interaction.reply(`🔍 Tidak ada tugas dengan deadline tanggal **${tanggal}**.`);
            return;
        }

        let reply = `📅 **Tugas dengan deadline tanggal ${tanggal}:**\n\n`;

        tempData.forEach(tugas => {
            reply += `> **${tugas.tugas}**\n`;
            reply += `> *Matkul:* ${tugas.matkul}\n`;
            reply += `> *Deadline:* \`${tugas.deadline}\`\n`;
            reply += `> *Deskripsi:* ${tugas.desc}\n`;
            reply += `\n---\n`;
        });

        await interaction.reply(reply);
    } else if (commandName === 'tugas-besok') {

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const formattedTomorrow = tomorrow.toLocaleDateString('en-CA', options).replace(/\//g, '-');

        const tugasQuery = query(
            collection(db, 'tugas_h'),
            where('deadline', '==', formattedTomorrow)
        );

        const get = await getDocs(tugasQuery);
        const tempData = [];

        get.forEach((data) => {
            tempData.push({ ...data.data(), id: data.id });
        });

        if (tempData.length === 0) {
            await interaction.reply("🔍 Tidak ada tugas dengan deadline besok mantap!");
            return;
        }

        let reply = "📅 **Tugas dengan deadline besok:**\n\n";

        tempData.forEach(tugas => {
            reply += `> **${tugas.tugas}**\n`;
            reply += `> *Matkul:* ${tugas.matkul}\n`;
            reply += `> *Deadline:* \`${tugas.deadline}\`\n`;
            reply += `> *Deskripsi:* ${tugas.desc}\n`;
            reply += `\n---\n`;
        });

        await interaction.reply(reply);

    } else if (commandName === 'list-tugas') {
        const get = await getDocs(collection(db, 'tugas_h'));
        const tempData = [];

        get.forEach((data) => {
            tempData.push({ ...data.data(), id: data.id });
        });

        if (tempData.length === 0) {
            await interaction.reply("📋 Tidak ada tugas yang tersedia.");
            return;
        }

        let reply = "📋 **Daftar Tugas:**\n\n";

        tempData.forEach(tugas => {
            reply += `> **${tugas.tugas}**\n`;
            reply += `> *Matkul:* ${tugas.matkul}\n`;
            reply += `> *Deadline:* \`${tugas.deadline}\`\n`;
            reply += `> *Deskripsi:* ${tugas.desc}\n`;
            reply += `\n---\n`;
        });

        await interaction.reply(reply);
    }
});

client.login(process.env.token);
