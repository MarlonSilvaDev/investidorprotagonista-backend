"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const PORT = Number(process.env.PORT) || 3000;
app_1.app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map