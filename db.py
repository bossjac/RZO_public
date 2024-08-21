import asyncio
import aiohttp
import firebase_admin
from firebase_admin import credentials, db
import time
from concurrent.futures import ThreadPoolExecutor
import re
import json

# Firebase configuration
cred = credentials.Certificate('products-db-v1-firebase-adminsdk-jaf44-645f5883cc.json')  # Replace with your service account key path
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://products-db-v1-default-rtdb.europe-west1.firebasedatabase.app/'
})

# API URL and headers
api_base_url = 'https://api.pharma.sobrus.com/products'
headers = {
    'Cookie': 'SBSID2=0su3ij3g0fcqrg00ee76umata8na42hkmv77un6d2jugevctoou69uvk8fur2ba1'
}

def sanitize_path(path):
    # First, strip any leading or trailing whitespace (including tabs)
    path = path.strip()
    # Then replace all remaining illegal characters with underscores
    return re.sub(r'[.#$\[\]/\t]', '_', path)

async def delete_data_in_batches():
    try:
        firebase_ref = db.reference('products')
        all_data = firebase_ref.get()

        if all_data:
            keys = list(all_data.keys())
            batch_size = 5000  # Adjust batch size as needed
            for i in range(0, len(keys), batch_size):
                batch_keys = keys[i:i + batch_size]
                batch_ref = firebase_ref
                updates = {key: None for key in batch_keys}
                batch_ref.update(updates)
                print(f"Successfully deleted {len(batch_keys)} items from Firebase.")
                await asyncio.sleep(1)  # Add a small delay to avoid overwhelming Firebase with too many requests
        else:
            print("No data found in Firebase to delete.")

    except Exception as e:
        print(f"Error deleting data from Firebase: {e}")

def user_confirmation():
    while True:
        user_input = input("Do you want to continue fetching and storing data? (yes/no): ").strip().lower()
        if user_input in ['yes', 'no']:
            return user_input == 'yes'
        else:
            print("Invalid input. Please enter 'yes' or 'no'.")

async def fetch_and_store_data(session, page):
    max_retries = 3
    retry_delay = 5  # seconds

    for attempt in range(max_retries):
        try:
            api_url = f'{api_base_url}?page={page}'
            print(f"Fetching data from page {page} (Attempt {attempt + 1})...")
            async with session.get(api_url) as response:
                response.raise_for_status()
                data = await response.json()

                if 'data' in data and isinstance(data['data'], list) and data['data']:
                    products = data['data']
                    for product in products:
                        try:
                            product_barcode = product.get('barcode')
                            product_id = str(product['ID'])

                            if product_barcode:
                                path = sanitize_path(product_barcode)
                            else:
                                path = sanitize_path(product_id)

                            if not path:
                                path = f"unknown_{product_id}"

                            firebase_ref = db.reference(f'products/{path}')
                            firebase_ref.set(product)
                        except Exception as e:
                            print(f"Error processing product: {e}")
                            print(f"Problematic product data: {json.dumps(product, indent=2)}")
                            print(f"Attempted path: products/{path}")

                    print(f"{len(products)} products processed on page {page}.")
                    return True
                else:
                    print(f"No valid product data found on page {page}. Stopping data fetching.")
                    return False

        except aiohttp.ClientError as e:
            print(f"Error fetching data from API: {e}. Retrying in {retry_delay} seconds...")
            await asyncio.sleep(retry_delay)
        except Exception as e:
            print(f"Unexpected error: {e}. Retrying in {retry_delay} seconds...")
            await asyncio.sleep(retry_delay)

    return False

async def main():
    # Delete existing data in Firebase in batches
    await delete_data_in_batches()

    # Ask user to confirm whether to continue fetching and storing data
    loop = asyncio.get_running_loop()
    with ThreadPoolExecutor() as pool:
        confirmation = await loop.run_in_executor(pool, user_confirmation)

    if not confirmation:
        print("User opted not to continue. Exiting...")
        return

    async with aiohttp.ClientSession(headers=headers) as session:
        page = 1
        while True:
            # Fetch data from current page
            continue_fetching = await fetch_and_store_data(session, page)
            if not continue_fetching:
                break  # Stop fetching if no more data or error occurred
            page += 1  # Move to the next page

# Execute asyncio event loop
if __name__ == "__main__":
    start_time = time.time()
    asyncio.run(main())
    print(f"Time taken: {time.time() - start_time} seconds.")
