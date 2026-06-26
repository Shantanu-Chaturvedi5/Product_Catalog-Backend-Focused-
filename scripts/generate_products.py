import random
from faker import Faker

fake = Faker()

CATEGORIES = [
    "Electronics",
    "Books",
    "Fashion",
    "Sports",
    "Toys"
]

def generate_product():

    return {
        "name": fake.word(),
        "category": random.choice(CATEGORIES),
        "price": round(
            random.uniform(10,1000),
            2
        )
    }