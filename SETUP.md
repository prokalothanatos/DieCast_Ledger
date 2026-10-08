# DieCast Ledger: setup guide

DieCast Ledger helps a die-cast seller photograph a car or box set, let research identify and price it, review it on a page laid out like eBay's listing form, and send it to eBay as a **draft** you finish and publish yourself. It keeps your whole collection in one place (the *Garage*).

> **Status of this guide.** It describes the copy you run on your own Windows PC. Two parts are still being finished and are marked **(coming)**: the Garage database that needs no Google account, and the one-file download package. Until then the Garage is stored in a Google Sheet (steps below).
> **Unofficial.** Not affiliated with or endorsed by Mattel, Hot Wheels, eBay, Google or GitHub. Hot Wheels is a trademark of Mattel, Inc.

Want to look before you install? The **live demo** runs in your browser with three sample cars and sends nothing anywhere: <https://prokalothanatos.github.io/DieCast_Ledger/>

---

## 1. What you need

| You need | Why | Notes |
|---|---|---|
| A Windows 10 or 11 PC | The app runs on it | About 1 GB free for the app, plus room for photos |
| **Python 3.12** | Runs the app | python.org, tick "Add Python to PATH" |
| **Google Chrome** | The app opens its own Chrome window to read eBay pages and Google Lens | Installed the normal way |
| An **eBay seller account** | To upload and publish your drafts | You sign in yourself in step 4 |
| A **GitHub account** (free) | Hosts your photos for eBay's file upload (see section 6) | Only for the file-upload route; you can skip it and add photos in Seller Hub |
| A **Google account** | Stores the Garage in a Google Sheet today **(coming: optional)** and Lens identifies cars | You create your own Google sign-in file once (section 3) |
| A phone or tablet camera | To photograph cars | Any phone or iPad on your Wi-Fi works; an Android phone on USB works too |

You do **not** need an eBay developer account or any eBay keys.

---

## 2. Install

1. **Download** the app (a zip file) and unzip it somewhere simple, such as `C:\DieCastLedger`. Don't put it inside OneDrive.
2. Open a Command Prompt in that folder (type `cmd` in the folder's address bar) and run:
   ```
   py -3 -m pip install -r requirements.txt
   ```
   No extra browser download is needed: the app uses the Chrome you already have.
3. **Start it** by double-clicking `run_dashboard.bat`. Leave the window open; closing it stops the app.
4. Open <http://127.0.0.1:8765> in your browser. You should see the home page with *New car or box set*, *Garage* and *Admin*.

---

## 3. Connect Google (Garage and Lens)

*(Coming: a local Garage database that needs no Google account. Lens will still use a normal Google page.)*

The Garage lives in your own Google Sheet, and photos go to your own Drive. The app signs in with a "Desktop app" sign-in file that **you** create once:

1. Go to <https://console.cloud.google.com/>, sign in, and create a project (any name).
2. Turn on the **Google Sheets API** and **Google Drive API**.
3. **APIs & Services → OAuth consent screen**: choose External, add your own email as a test user.
4. **Credentials → Create credentials → OAuth client ID → Desktop app.** Download the JSON and save it as `credentials.json` in the app folder.
5. Start the app. The first time it needs Google, a browser window asks you to approve. That creates `token.json`.

> While the consent screen is in "Testing", Google asks you to approve again about every 7 days. Choosing **Publish app** stops that.
> **Keep `credentials.json` and `token.json` private.** Never upload them or share the folder.

---

## 4. Sign in to eBay (once)

The app keeps its own Chrome profile, separate from yours. Sign in to eBay in it once:

```
py -3 dashboard\ebay_builder.py login
```

A Chrome window opens: sign in to your seller account normally. Your sign-in stays in that profile. If eBay ever shows a verification page, finish it yourself in that window and run the step again. The app never solves CAPTCHAs for you.

---

## 5. Add a car

1. Open the home page → **New car or box set**.
2. **Photograph it.** A carded or loose car takes 2 photos; a box set takes 6 (front, back, top, bottom, left, right). Use the phone's browser (see below) or an Android phone on USB.
3. **Research runs by itself:** Google Lens identifies it, the **Hot Wheels Wiki** gives the casting name, year and series, sold listings give the price and the wording sellers use, and the UPC is read from the box bottom.
4. **Review** the eBay-style page. Blank required fields are marked red. Dropdowns match eBay's own lists.
5. Press **Done**. The car is added to the Garage.

**Using a phone or tablet as the camera:** on the PC open the **Admin** page, set a PIN with the link there, and note the address it shows (like `http://192.168.1.20:8765`). Open that address on the phone (same Wi-Fi), enter the PIN, and use the camera button.

---

## 6. Send it to eBay (recommended route: the export file)

On any car's page press **Export listing file**. You get a small file that you upload yourself in Seller Hub. It can only create a **draft**: it never publishes.

**Photos.** eBay's file upload needs your photos as public web links. The easy way is your own GitHub:

1. On the **Admin** page, press **Sign in with GitHub**. A short code appears. Open the page it shows, type the code, and press Authorize. (The app asks only to write to your public repositories. Your password never goes through the app. You can revoke it any time at github.com/settings/applications.)
2. In the **Export listing file** window choose **Host them on my GitHub**. The app creates a public repository named `diecast-ledger-photos` in *your* account and puts the photos there.
3. Don't want GitHub? Choose **Leave the photo links blank** and add the photos in Seller Hub after the upload.

**Upload.**

1. In eBay open **Seller Hub → Reports → Uploads → Upload template** and choose the file. It starts at once and creates a draft.
2. Open **Listings → Drafts**, open the draft, check it, and finish it. The file carries the title, price, UPC, condition, photos, description and the **item specifics** (Brand, Vehicle Make, Scale, Series, Year, Color, Model and so on, as eBay's own values). It does **not** carry shipping, offers or returns, so those are set in the draft.
   - **Shipping: choose one of two ways.** A draft made from a file comes with eBay's plain defaults (standard shipping, flat cost, no package weight or size), so shipping always needs a quick look in each draft:
     1. **Let eBay estimate it (recommended, one-time setting).** In any draft open **See shipping options** (at the right of the Shipping heading) and switch **Autofill shipping details** on. eBay then suggests the package weight and size from similar listings. In each draft press **Apply Estimate**, and change **Cost type** to *Calculated* if you want shipping worked out from the weight and size.
     2. **Set it by hand for each draft.** Type the package weight and size yourself, choose the shipping service and cost type, and set the handling time.
   - **Allow offers**, returns and the item specifics are also set in the draft. (eBay's **Business policies** can store shipping, return and payment settings for reuse, but turning them on changes eBay's listing form, so try them on one draft first.)
3. Publish it yourself.

**Photos and timing: read this.**
- A **draft only links** to your GitHub photos. If you delete them early, the draft's photos go blank.
- **Publishing makes eBay keep its own copy.** Once your listing is live and showing its photos, press **Remove these photos from GitHub** in the export window. (GitHub can keep serving a deleted file for a few minutes.)

---

## 7. Other ways to get a draft onto eBay

The app can also build the whole draft itself by driving the eBay page in its own Chrome window, filling every field including shipping and offers. This is the most complete route, but it is automated use of eBay's website. **eBay's User Agreement says users may not use robots, scrapers or other automated means to access its services without eBay's permission.** Use the export-file route if you want to stay clear of that. Whichever route you use, you are responsible for following eBay's rules and for the accuracy of your listings. **The app never publishes a listing, and never ends one unless you press the button for it.**

---

## 8. Where your data lives

| What | Where |
|---|---|
| Garage | Your Google Sheet **(coming: a file on your PC)** |
| Photos | Your Google Drive, and your GitHub photo repository only while you need them |
| Google sign-in | `credentials.json`, `token.json` in the app folder |
| GitHub sign-in | `dashboard\github_token.json` (this PC only) |
| eBay sign-in | the app's Chrome profile in `chrome_profile\` (this PC only) |
| Network PIN | `dashboard\pin.json` (stored as a one-way hash) |

None of these should ever be uploaded, emailed or committed to a public repository. The **Admin** page can run a backup and shows what the app is doing.

---

## 9. If something goes wrong

- **The page doesn't open:** make sure the `run_dashboard.bat` window is still open. The Admin page has a Restart button.
- **"Chrome not found":** install Google Chrome the normal way (the app looks in Program Files).
- **eBay shows "verify" or a robot check:** finish it yourself in the app's Chrome window, then try again.
- **Lens or eBay comps came back empty:** run **Re-run research** on the car page. Few sold listings means a rare car or a different name.
- **Google asks you to sign in again:** normal while the consent screen is in "Testing" (section 3).
- **GitHub sign-in asks you to confirm access:** that's GitHub's normal security check (sudo mode). Use your password or the GitHub Mobile prompt.
- **A phone can't connect:** the phone must be on the same Wi-Fi; allow Python through the Windows firewall when asked.

---

## 10. Credits and notes

- Casting names, years and series come from the **Hot Wheels Wiki** (<https://hotwheels.fandom.com>), whose text is available under a Creative Commons Attribution-ShareAlike license.
- Sold-price wording comes from public sold listings. Read-only; nothing is bought or bid on.
- No software license has been chosen yet, so all rights are reserved for now.
