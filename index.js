const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder  } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { getDocs, collection, query, where } = require('firebase/firestore');
const { db } = require('./firebase');

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
    new SlashCommandBuilder()
    .setName('tes')
    .setDescription('Cek apakah ada anomali'),
].map(command => command.toJSON());

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.clientId), // Mendaftar secara global semua server (yang ada bot ini)
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
        const tanggal = options.getString('tanggal'); // Ambil input tanggal dari user

        if (!tanggal) {
            await interaction.reply('🔴 Mohon masukkan tanggal dengan format YYYY-MM-DD.');
            return;
        }

        // Query untuk mendapatkan tugas berdasarkan tanggal
        const tugasQuery = query(
            collection(db, 'tugas_h'),
            where('deadline', '==', tanggal)
        );

        const get = await getDocs(tugasQuery);
        const tempData = [];

        get.forEach((data) => {
            tempData.push({ ...data.data(), id: data.id });
        });

        // Jika tidak ada tugas pada tanggal tersebut
        if (tempData.length === 0) {
            await interaction.reply(`🔍 Tidak ada tugas dengan deadline tanggal **${tanggal}**.`);
            return;
        }

        // Gunakan deferReply untuk menunda respons
        await interaction.deferReply();

        // Membuat array untuk embed
        const embeds = [];

        // Loop untuk setiap tugas
        tempData.forEach(tugas => {
            // Warna acak
            const randomColor = Math.floor(Math.random() * 16777215).toString(16);

            // Membuat embed untuk setiap tugas
            const embed = new EmbedBuilder()
                .setTitle(`📋 **${tugas.tugas}**`) // Judul embed dengan nama tugas
                .setColor(`#${randomColor}`) // Warna acak untuk setiap embed
                .addFields(
                    { name: 'Matkul', value: tugas.matkul, inline: true },
                    { name: 'Deadline', value: `\`${tugas.deadline}\``, inline: true },
                    { name: 'Deskripsi', value: tugas.desc || 'Tidak ada deskripsi.' }
                )
                .setFooter({ text: `ID Tugas: ${tugas.id}` }); // Footer dengan ID tugas

            // Tambahkan embed ke array
            embeds.push(embed);
        });

        // Kirim semua embed sekaligus
        await interaction.editReply({ embeds: embeds });
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
            await interaction.reply("🔍 Tidak ada tugas dengan deadline besok, mantap!");
            return;
        }

        await interaction.deferReply();

        const embeds = [];

        tempData.forEach(tugas => {
            const randomColor = Math.floor(Math.random() * 16777215).toString(16);

            const embed = new EmbedBuilder()
                .setTitle(`📋 **${tugas.tugas}**`) 
                .setColor(`#${randomColor}`)
                .addFields(
                    { name: 'Matkul', value: tugas.matkul, inline: true },
                    { name: 'Deadline', value: `\`${tugas.deadline}\``, inline: true },
                    { name: 'Deskripsi', value: tugas.desc || 'Tidak ada deskripsi.' }
                )
                .setFooter({ text: `ID Tugas: ${tugas.id}` }); 
            
            embeds.push(embed);
        });

        await interaction.editReply({ embeds: embeds });
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

        await interaction.deferReply();

        const embeds = [];

        tempData.forEach(tugas => {
            const randomColor = Math.floor(Math.random() * 16777215).toString(16);

            const embed = new EmbedBuilder()
                .setTitle(`📋 **${tugas.tugas}**`)
                .setColor(`#${randomColor}`)
                .addFields(
                    { name: 'Matkul', value: tugas.matkul, inline: true },
                    { name: 'Deadline', value: `\`${tugas.deadline}\``, inline: true },
                    { name: 'Deskripsi', value: tugas.desc || 'Tidak ada deskripsi.' }
                )
                .setFooter({ text: `ID Tugas: ${tugas.id}` });

            embeds.push(embed);
        });

        await interaction.editReply({ embeds: embeds });
    } else if (commandName === 'tes') {
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Error!') 
            .setDescription("Bot telah tewass...") 
            .addFields(
                { name: 'Kemungkinan Anomali:', value: 'Hosting mati / database sekarat' }, 
                { name: 'Solusi:', value: 'Coba restart bot atau cek koneksi database.' }  
            )
            .setFooter({ text: 'Pengingat Tugas Bot', iconURL: 'https://i.imgur.com/AfFp7pu.png' }) 
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
});

client.login(process.env.token);