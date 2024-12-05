import { EmbedBuilder } from "discord.js";
import axios from "axios";
import fs from "node:fs";
import { and, eq } from "drizzle-orm";
import type { Client } from "../structures/DiscordClient";
import Commands from "../commands"

export default async function(client: Client) {
	console.log(`\x1b[32mThe app is online (logged as ${client.user?.tag})\x1b[0m`);

	const remindersSchema = client.dbSchema.reminders

	setInterval(async () => {
		const reminders = await client.db.query.reminders.findMany()

		for (const reminder of reminders) {
			const reminderDate = new Date(reminder.date)

			if (Date.now() > reminderDate.getTime()) {
				try {
					const user = await client.users.fetch(reminder.userId)

					if (!user) {
						return await client.db
							.delete(remindersSchema)
							.where(
								and(
									eq(remindersSchema.reminderId, reminder.reminderId),
									eq(remindersSchema.userId, reminder.userId)
								)
							)
					};

					const embed = new EmbedBuilder()
						.setTitle('Reminder')
						.setDescription(reminder.description)

					await user.send({
						embeds: [embed]
					})

					await client.db
						.delete(remindersSchema)
						.where(
							and(
								eq(remindersSchema.reminderId, reminder.reminderId),
								eq(remindersSchema.userId, reminder.userId)
							)
						)
				} catch(e) {
					console.log(e)

					await client.db
						.delete(remindersSchema)
						.where(
							and(
								eq(remindersSchema.reminderId, reminder.reminderId),
								eq(remindersSchema.userId, reminder.userId)
							)
						)
				}
			}
		}
	}, 30000)

	const commands = await client.application?.commands.fetch();

	try {
		await axios.put(
			`https://discord.com/api/v10/applications/${client.user?.id}/commands`,
			Commands,
			{
				headers: {
					Authorization: `Bot ${client.config.token}`,
					"Content-Type": "application/json; charset=UTF-8",
					"User-Agent": "DiscordBot (discord.js, 14.14.1 (modified))",
				},
			},
		);
	} catch (err) {
		console.error(JSON.stringify(err.response.data, null, 2));
	}

	if (!commands || commands.size === 0) {
		Bun.write(`${__dirname}/../data/permissions/commandPermissions.json`, "{}");
	}
};
