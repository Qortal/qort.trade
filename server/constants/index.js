const playingAmount = 0.25;
const homeAddress = 'Qa4cxK73TXWgA8fXs7sK1fp96syCQTSTmQ'
const walletVersion = 2;
const TX_TYPES = {
	1: "Genesis",
	2: "Payment",
	3: "Name registration",
	4: "Name update",
	5: "Sell name",
	6: "Cancel sell name",
	7: "Buy name",
	8: "Create poll",
	9: "Vote in poll",
	10: "Arbitrary",
	11: "Issue asset",
	12: "Transfer asset",
	13: "Create asset order",
	14: "Cancel asset order",
	15: "Multi-payment transaction",
	16: "Deploy AT",
	17: "Message",
	18: "Chat",
	19: "Publicize",
	20: "Airdrop",
	21: "AT",
	22: "Create group",
	23: "Update group",
	24: "Add group admin",
	25: "Remove group admin",
	26: "Group ban",
	27: "Cancel group ban",
	28: "Group kick",
	29: "Group invite",
	30: "Cancel group invite",
	31: "Join group",
	32: "Leave group",
	33: "Group approval",
	34: "Set group",
	35: "Update asset",
	36: "Account flags",
	37: "Enable forging",
	38: "Reward share",
	39: "Account level",
	40: "Transfer privs",
	41: "Presence"
}
const QORT_DECIMALS = 1e8
const CHAT_REFERENCE_FEATURE_TRIGGER_TIMESTAMP = 1674316800000

module.exports = { playingAmount, homeAddress, walletVersion, TX_TYPES, QORT_DECIMALS, CHAT_REFERENCE_FEATURE_TRIGGER_TIMESTAMP };