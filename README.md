# MyDU Mod Manager

For players to be able to sync their mods with servers

Credit to NQ/BearClaw for I based this on his work [here](https://github.com/dual-universe/mydu-server-mods/blob/main/ClientModManager/clientmodmanager.py)

# I'm a Player

Go to releases and download a standalone (zip) or installer (exe)

# I'm a Server admin

Expose an endpoint that players can download mods:

```json
{
	"name": "Server Name",
	"mods": [
		"com.github.VoidRunner87.some_mod-1.2.3"
	]
}

```

Also on the same folder as the manifest, add the files listed on the mods property. Ie:

* com.github.VoidRunner87.some_mod-1.2.3.zip

It has to be a zip file
On the manifest you can ommit the zip extension.
