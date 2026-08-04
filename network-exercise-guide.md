# 接続実習１ - Step by Step Guide (PDF Material Anusar)
### Topology: PC0,PC1 - Switch0 - Router1 - Router2 - Switch1 - PC2,PC3

Yo guide tapaile upload gareko PDF (ネットワーク構築実習) ko "接続実習１" section ma diyeko exact steps ra IP scheme use garera banayeko ho.

---

## Step 0: Network Design (IP Addressing Plan)

PDF ko rule: Router le hamesa `*.*.*.254` ra `*.*.*.253` IP use garcha. Router-Router link `192.168.5.0/24` ma huncha.

| Device | Interface | IP Address | Subnet Mask |
|---|---|---|---|
| PC0 | NIC | 192.168.1.1 (kunai free IP) | 255.255.255.0 |
| PC1 | NIC | 192.168.1.2 | 255.255.255.0 |
| Router1 | Gi0/0 (Switch0 tira) | **192.168.1.254** | 255.255.255.0 |
| Router1 | Gi0/1 (Router2 tira) | **192.168.5.253** | 255.255.255.0 |
| Router2 | Gi0/1 (Router1 tira) | **192.168.5.254** | 255.255.255.0 |
| Router2 | Gi0/0 (Switch1 tira) | **192.168.10.253** | 255.255.255.0 |
| PC2 | NIC | 192.168.10.1 | 255.255.255.0 |
| PC3 | NIC | 192.168.10.2 | 255.255.255.0 |

> Note: PDF ma router ko LAN interface `GigabitEthernet0/0` ra `GigabitEthernet0/1` use bhako cha (1941 router ma yehi huncha). Cable connect garda link "red triangle" dekhincha - link up bhaisake pachi green huncha.

---

## Step 1: Cabling (Physical Connections)

1. **PC0 ↔ Switch0** - Straight cable, Switch ko FastEthernet0/1~24 kunai port ma.
2. **PC1 ↔ Switch0** - Straight cable, arko free port ma.
3. **Switch0 ↔ Router1** - Straight cable. Switch tira GigabitEthernet0/1 or 0/2, Router1 tira GigabitEthernet0/0.
4. **Router1 ↔ Router2** - Straight cable, Router1 ko GigabitEthernet0/1 ← → Router2 ko GigabitEthernet0/1 (tapaiko diagram ma red box le highlight gareko link yehi ho).
5. **Switch1 ↔ Router2** - Straight cable, Router2 ko GigabitEthernet0/0.
6. **PC2 ↔ Switch1**, **PC3 ↔ Switch1** - Straight cable.

> Straight cable = farak layer ko device connect garda use huncha (PC-Switch, Switch-Router). Cross cable chai same-type device (PC-PC) ma use huncha - haal ka device ma auto-detect bhaye pani PDF ma yo distinction sikaieko cha.

---

## Step 2: Router1 Configure Garne (192.168.1/24 side)

Router1 click garnu → **Config** tab → GigabitEthernet0/0 select garnu → IP Address ra Subnet Mask directly type garnu:

```
IP Address:  192.168.1.254
Subnet Mask: 255.255.255.0
```

Ani **CLI** tab ma janu ra `no shutdown` command haldinu (link up huna paryo):

```
Router> enable
Router# configure terminal
Router(config)# interface GigabitEthernet0/0
Router(config-if)# no shutdown
Router(config-if)# exit
Router(config)# exit
```

`exit` lai 2 choti hanera Router# mode ma pharkinu, ani ping test garne:

```
Router# ping 192.168.1.1
```

### PC0, PC1 ma IP set garne

PC click → **Desktop** → **IP Configuration**:
- PC0: `192.168.1.1 / 255.255.255.0` → Default Gateway: `192.168.1.254`
- PC1: `192.168.1.2 / 255.255.255.0` → Default Gateway: `192.168.1.254`

Test: PC0 ↔ PC1 ping, ani PC0/PC1 → Router1 (`192.168.1.254`) ping - result "Success 100%, 5/5" aaunu parcha.

Setting theek bhaye Router1 ma save garne:

```
Router1# write memory
Building configuration...
[OK]
```

---

## Step 3: Router2 Configure Garne (192.168.10/24 side)

Router1 jasto nai process, opposite side ma:

**Config tab** ma GigabitEthernet0/0:
```
IP Address:  192.168.10.253
Subnet Mask: 255.255.255.0
```

**CLI** ma:
```
Router2(config)# interface GigabitEthernet0/0
Router2(config-if)# no shutdown
Router2(config-if)# exit
```

### PC2, PC3 ma IP set garne
- PC2: `192.168.10.1 / 255.255.255.0` → Default Gateway: `192.168.10.253`
- PC3: `192.168.10.2 / 255.255.255.0` → Default Gateway: `192.168.10.253`

Test: PC2 ↔ PC3, ani PC2/PC3 → Router2 ping.

---

## Step 4: Router1 ↔ Router2 Link Connect Garne (192.168.5/24)

### Router1 tira (GigabitEthernet0/1):
```
IP Address:  192.168.5.253
Subnet Mask: 255.255.255.0
```
CLI ma `no shutdown` garna bir sanu:
```
Router1(config)# interface GigabitEthernet0/1
Router1(config-if)# ip address 192.168.5.253 255.255.255.0
Router1(config-if)# no shutdown
Router1(config-if)# exit
```

### Router2 tira (GigabitEthernet0/1):
```
IP Address:  192.168.5.254
Subnet Mask: 255.255.255.0
```
```
Router2(config)# interface GigabitEthernet0/1
Router2(config-if)# ip address 192.168.5.254 255.255.255.0
Router2(config-if)# no shutdown
Router2(config-if)# exit
```

Router2 bata Router1 lai ping garera check garnu:
```
Router2# ping 192.168.5.253
```
(Pahilo ping kahile kahi fail huncha - ARP resolve garna time laagcha, 2nd attempt ma 5/5 aauncha.)

---

## Step 5: Static Route Set Garne

Aile samma PC0/PC1 le PC2/PC3 lai chinena, kina ki 192.168.1/24 ra 192.168.10/24 beech ko baato (route) thaha chaina. Yesko lagi **static route** halne.

### Router1 ma (GUI method - Config tab → ROUTING → Static):

| Field | Value |
|---|---|
| Network | 192.168.10.0 |
| Mask | 255.255.255.0 |
| Next Hop | 192.168.5.254 |

**Add** button click garne.

CLI equivalent:
```
Router1(config)# ip route 192.168.10.0 255.255.255.0 192.168.5.254
```

### Router2 ma (GUI method):

| Field | Value |
|---|---|
| Network | 192.168.1.0 |
| Mask | 255.255.255.0 |
| Next Hop | 192.168.5.253 |

CLI equivalent:
```
Router2(config)# ip route 192.168.1.0 255.255.255.0 192.168.5.253
```

> Static route matlab: admin le manually bhannu "yo destination network samma pugna yaha (next hop) bata jaanu".

---

## Step 6: Full Ping Test (End-to-End)

Sabai PC ko Default Gateway set bhaisakepachi:
- PC0/PC1 → PC2 (`192.168.10.1`) ping
- PC0/PC1 → PC3 (`192.168.10.2`) ping
- PC2/PC3 → PC0 (`192.168.1.1`) ping
- PC2/PC3 → PC1 (`192.168.1.2`) ping

Sabai Success 100% aaunu parcha. Yedi fail bhaye:
- Interface `no shutdown` gareko cha ki nai check garnu
- Static route ko Network/Mask/Next Hop galat cha ki check garnu
- PC ko Default Gateway sahi cha ki check garnu

---

## Step 7: Configuration Save Garne (Dubai Router)

```
Router1# write memory
Router2# write memory
```

Ra Packet Tracer file: **File → Save As** garera `.pkt` file save garnu.

---

## Bonus Step (PDF ma cha): Web Server Thapne

PDF ko exercise le agadi Web Server (192.168.10.10) pani thapchha - optional practice ko lagi:

1. End Devices bata **Server-PT** drag garera Switch1 ma connect garnu.
2. Server ko IP: `192.168.10.10 / 255.255.255.0`, Default Gateway pahila khali rakhne.
3. Server ko Command Prompt bata ping garera 192.168.10/24 ma matra access huncha check garnu (192.168.1/24 bata fail hunu normal ho - gateway navako le).
4. Browser bata `http://192.168.10.10` ra `https://192.168.10.10` access garera herne.
5. **SERVICES** tab bata Email service OFF garne (test mail nagos vanera).
6. Confirm bhaisake pachi Server ma Default Gateway `192.168.10.253` set garne - ani 192.168.1/24 (PC0,PC1) bata pani Web page access hunthalcha.

---

Yo pura guide PDF ko actual exercise steps ho - Packet Tracer ma afai follow garera banaunuhos. Kunai step ma atkiyo bhane screenshot sahit sodhna sakinuhuncha.
