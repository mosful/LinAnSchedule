# 使用官方的 Node.js 20 LTS (長期支援) 版本作為基礎
FROM node:20-slim

# 在容器中建立一個工作目錄
WORKDIR /usr/src/app

# 複製 package.json 和 package-lock.json 檔案
# 利用 Docker 的層級快取機制，只有在這些檔案變更時才會重新安裝套件
COPY package*.json ./

# 安裝專案依賴的套件
RUN npm install

# 複製所有專案檔案到工作目錄
COPY . .

# 向外部開放容器的 3000 port (我們在 server.js 中設定的 port)
EXPOSE 3000

# 容器啟動時要執行的指令
CMD [ "node", "server.js" ]
