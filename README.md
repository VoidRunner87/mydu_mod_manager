# MyDU Mod Manager

For players to be able to sync their mods with servers

Credit to NQ/BearClaw for I based this on his work [here](https://github.com/dual-universe/mydu-server-mods/blob/main/ClientModManager/clientmodmanager.py)

# I'm a Player

Go to releases and download a standalone (zip) or installer (exe)

## Usage

Set where your game folder is located:

![image](https://github.com/user-attachments/assets/ff66d797-b8bc-4882-8dab-73be60ea048c)

Set the URL of the server to sync:

![image](https://github.com/user-attachments/assets/30f3d030-0bb0-4eea-86cc-acfd26e61acf)

Press `SYNC`

Select All mods you want to install and press `INSTALL`

![image](https://github.com/user-attachments/assets/8eb0c58c-3e03-4082-8d2c-ef61121e94bb)

The app stores all mods downloaded on a folder called `mods-cache` inside the game's folder.

The app "installs" mods by copying form `mods-cache` to the `Game/data/resources_generated/mods` folder

## To uninstall a mod:

Select the mods you want to uninstall and press ![image](https://github.com/user-attachments/assets/f7d8622b-ba55-4a92-9eea-5bf1727ae624)

## To delete a mod from the cache:

Select the mods you want to delete and press ![image](https://github.com/user-attachments/assets/d7c58bd8-1b48-4e6b-a526-c3e49fdaedcb)

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
