module.exports = {
    name: 'perms',
    
    async autocomplete(client, int) {
        const value = int.options.getFocused()
        const commands = client.commands

        const matches = commands
            .map(cmd => ({
                name: cmd.name,
                value: cmd.name
            }))
            .filter(cmd => cmd.name.toLowerCase().startsWith(value.toLowerCase()))

        if (matches.length > 25) matches = matches.slice(0, 24)

        await int.respond(matches)
    },
    async execute(client, int) {
        const subcommand = int.options.getSubcommand()
        
        require(`./perms/${subcommand}.js`)(client, int)
    }
}