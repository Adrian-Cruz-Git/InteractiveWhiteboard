# InteractiveWhiteboard


## Installation
### Perequisites
- **Node.js 18+ (LTS recommended)**
- Package Manager: **npm**
- coding enviroment of choice: Vscode

#### Prequisite installation
Node.js download (donwload LTS version):
- https://nodejs.org/en/download/current

Vscode enviroment download:
- https://code.visualstudio.com/download

check your versions:
```bash
node -v
npm -v
```

## Start project
### 1) Unzip the project
- **If you downloaded a ZIP**: right-click → **Extract** / **Unzip** it.
- **If using Git**: clone the repo, then open the folder.

Open a terminal **inside** the project folder.

#### How to open a terminal
- **Windows**: In the folder, click the address bar -> type `cmd` -> press **Enter**, or right-click -> **Open in Terminal**.
- **macOS**: Open **Terminal** (Cmd+Space -> “Terminal”) -> then type `cd ` -> drag the folder into the Terminal window -> press **Enter**.
- **VS Code** (nice option): Open the folder in VS Code -> menu **Terminal -> New Terminal**.

You should now see a prompt that ends with your project folder’s name.

### 2) go into front-end using terminal to install dependancies
```bash
cd /front-end
```
### 3) install of dependancies
```bash
npm install
```
### 4) start project
```bash
npm run dev
```
by default the server is on: http://localhost:5173

## extra information
- Change port
```bash
npm run dev -- --port 3000
```
- expose to lan/devices
```bash
npm run dev -- --host
```
- Stop server<br>
  To stop the server go to the terminal and press Ctrl + c (Cmd + c on macOS)
  press y or enter if asked.
