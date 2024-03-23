const axios = require('axios')
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js')

module.exports = {
    name: 'Save as Tag',
    
    async execute(client, int) {
        if (!int.targetMessage.content || int.targetMessage.content?.length <= 0) return int.reply({
            content: 'This message has no content',
            ephemeral: true
        })

        const modal = new ModalBuilder()
            .setTitle('Create a Tag')
            .setCustomId('createTag')
        
        const nameOption = new TextInputBuilder()
            .setCustomId('name')
            .setLabel('Name')
            .setMinLength(1)
            .setRequired(true)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(int.targetMessage.content.split(' ')[0].substr(0, 25))

        const nameRow = new ActionRowBuilder()
            .addComponents([nameOption])

        modal
            .addComponents([nameRow])

        await int.showModal(modal)

        int.awaitModalSubmit({
            filter: (interaction) => interaction.customId == "createTag" && interaction.user.id == int.user.id,
            time: 60e3
        }).then(async (interaction) => {
            const tagName = interaction.fields.getTextInputValue("name")
            const tagContent = int.targetMessage.content.length >= (2000 - 58 - tagName.length) ? `${int.targetMessage.content.substr(0, (2000 - 58 - tagName.length))}...` : int.targetMessage.content

            let userData = await client.mongo.tags.findOne({
                id: int.user.id
            })
            
            if (!userData) userData = new client.mongo.tags({
                id: int.user.id,
                tags: []
            })

            const tags = [
                ...userData.tags
            ]
            
            const existingTag = tags.find(tag => tag.name == tagName)
            
            if (existingTag) {
                const tagIndex = tags.findIndex(tag => tag.name == tagName)
                
                tags[tagIndex].value = tagContent
                
                interaction.reply({
                    content: `Successfully replaced the tag \`${tagName}\` with the content:\n>>> ${tagContent.length >= (2000 - 58 - tagName.length) ? `${tagContent.substr(0, (2000 - 58 - tagName.length))}...` : tagContent}`,
                    ephemeral: true
                })
            } else {
                tags.push({
                    name: tagName,
                    value: tagContent
                })
                
                interaction.reply({
                    content: `Successfully set the tag \`${tagName}\` with the content:\n>>> ${tagContent.length > (2000 - 58 - tagName.length) ? `${tagContent.substr(0, (2000 - 58 - tagName.length))}...` : tagContent}`,
                    ephemeral: true
                })
            }
            
            userData.tags = tags
            
            await userData.save()
        })
    }
}