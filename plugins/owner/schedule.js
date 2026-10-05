/**
 * @file plugins/owner/schedule.js
 * @description Command untuk mengelola scheduled messages
 * @author Ourin-AI Team
 * @version 1.1.0
 */

const { 
    scheduleMessage, 
    cancelScheduledMessage, 
    getScheduledMessages,
    getSchedulerStatus,
    formatTimeRemaining,
    getMsUntilTime
} = require('../../src/lib/scheduler');

/**
 * Konfigurasi plugin
 */
const pluginConfig = {
    name: 'schedule',
    alias: ['sched', 'jadwal', 'timer'],
    category: 'owner',
    description: 'Kelola scheduled messages',
    usage: '.schedule <add/list/del/status> [options]',
    example: '.schedule add 08:00 628xxx Hello!',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    limit: 0,
    isEnabled: true
};

/**
 * Handler untuk command schedule
 */
async function handler(m, { sock }) {
    const args = m.args || [];
    const subCommand = args[0]?.toLowerCase();
    
    if (!subCommand) {
        const helpText = `📅 *Schedule Manager*

*Usage:*
• \`.schedule add <HH:MM> <jid> <message>\`
  Tambah pesan terjadwal
  
• \`.schedule list\`
  Lihat semua jadwal
  
• \`.schedule del <id>\`
  Hapus jadwal
  
• \`.schedule status\`
  Lihat status scheduler

*Example:*
\`.schedule add 08:00 6281234567890@s.whatsapp.net Selamat pagi!\`
\`.schedule add 12:00 ${m.chat} repeat Sudah siang!\``;
        
        await m.reply(helpText);
        return;
    }
    
    switch (subCommand) {
        case 'add': {
            // Format: .schedule add HH:MM jid message
            // atau: .schedule add HH:MM jid repeat message
            const timeStr = args[1];
            let jid = args[2];
            let repeat = false;
            let messageText;
            
            if (!timeStr || !jid) {
                await m.reply('❌ Format: `.schedule add <HH:MM> <jid> [repeat] <message>`');
                return;
            }
            
            // Parse time
            const timeParts = timeStr.split(':');
            if (timeParts.length !== 2) {
                await m.reply('❌ Format waktu salah. Gunakan HH:MM (contoh: 08:00)');
                return;
            }
            
            const hour = parseInt(timeParts[0]);
            const minute = parseInt(timeParts[1]);
            
            if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                await m.reply('❌ Waktu tidak valid. Hour: 0-23, Minute: 0-59');
                return;
            }
            
            // Check if repeat
            if (args[3]?.toLowerCase() === 'repeat') {
                repeat = true;
                messageText = args.slice(4).join(' ');
            } else {
                messageText = args.slice(3).join(' ');
            }
            
            // Handle special jid values
            if (jid === 'me' || jid === 'self') {
                jid = m.sender;
            } else if (jid === 'here' || jid === 'this') {
                jid = m.chat;
            } else if (!jid.includes('@')) {
                jid = jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            }
            
            if (!messageText) {
                await m.reply('❌ Pesan tidak boleh kosong');
                return;
            }
            
            // Generate unique ID
            const id = `sched_${Date.now()}`;
            
            try {
                const task = scheduleMessage({
                    id,
                    jid,
                    message: { text: messageText },
                    hour,
                    minute,
                    repeat
                }, sock);
                
                const msUntil = getMsUntilTime(hour, minute);
                
                await m.reply(`✅ *Scheduled Message Added*

📝 ID: \`${id}\`
⏰ Time: ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}
📍 Target: ${jid}
🔄 Repeat: ${repeat ? 'Yes (daily)' : 'No (once)'}
⏳ Next run in: ${formatTimeRemaining(msUntil)}

Message: ${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}`);
            } catch (error) {
                await m.reply(`❌ Gagal: ${error.message}`);
            }
            break;
        }
        
        case 'list': {
            const tasks = getScheduledMessages();
            
            if (tasks.length === 0) {
                await m.reply('📅 Tidak ada scheduled messages');
                return;
            }
            
            let text = `📅 *Scheduled Messages (${tasks.length})*\n\n`;
            
            for (const task of tasks) {
                const msUntil = getMsUntilTime(task.hour, task.minute);
                text += `• *${task.id}*\n`;
                text += `  ⏰ ${String(task.hour).padStart(2, '0')}:${String(task.minute).padStart(2, '0')}\n`;
                text += `  📍 ${task.jid.split('@')[0]}\n`;
                text += `  🔄 ${task.repeat ? 'Daily' : 'Once'}\n`;
                text += `  ⏳ In ${formatTimeRemaining(msUntil)}\n\n`;
            }
            
            await m.reply(text.trim());
            break;
        }
        
        case 'del':
        case 'delete':
        case 'remove': {
            const taskId = args[1];
            
            if (!taskId) {
                await m.reply('❌ Format: `.schedule del <id>`');
                return;
            }
            
            const cancelled = cancelScheduledMessage(taskId);
            
            if (cancelled) {
                await m.reply(`✅ Scheduled message \`${taskId}\` dihapus`);
            } else {
                await m.reply(`❌ Task \`${taskId}\` tidak ditemukan`);
            }
            break;
        }
        
        case 'status': {
            const status = getSchedulerStatus();
            
            const text = `📊 *Scheduler Status*

🔄 Daily Limit Reset: ${status.dailyResetEnabled ? '✅ Active' : '❌ Inactive'}
📅 Last Reset: ${status.lastLimitReset}
📝 Scheduled Messages: ${status.scheduledMessagesCount}

📈 *Statistics*
• Total Resets: ${status.totalResets}
• Messages Sent: ${status.totalMessagesSent}`;
            
            await m.reply(text);
            break;
        }
        
        default:
            await m.reply('❌ Subcommand tidak dikenal. Gunakan: add, list, del, status');
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
