import json
import re

text = """{ "title": "Velvet Blush", "recipe": "### Description\\nThis luxurious take on the classic Brazilian Batida combines the sweetness of fresh strawberries with the rich, creamy texture of coconut, all elevated by the complex notes of aged cachaça and a whisper of rose. It's a romantic and decadent cocktail, perfect for a special occasion.\\n\\n### Ingredients\\n* **2 oz (60 ml)** Aged Cachaça (e.g., Avuá Amburana)\\n* **4-5** Ripe Strawberries, hulled (plus one for garnish)\\n* **1 oz (30 ml)** Coconut Cream\\n* **0.5 oz (15 ml)** Freshly Squeezed Lime Juice\\n* **0.5 oz (15 ml)** Rose Simple Syrup*\\n\\n**Rose Simple Syrup: Combine 1 cup sugar and 1 cup water in a saucepan. Heat gently until sugar is dissolved. Remove from heat, let cool, and stir in 1 tsp of food-grade rosewater. Store in the refrigerator.*\\n\\n### Equipment\\n* Cocktail Shaker\\n* Muddler\\n* Strainer\\n* Diamond-cut Rocks Glass\\n\\n### Instructions\\n1. Place the 4-5 hulled strawberries and rose simple syrup in the bottom of your cocktail shaker.\\n2. Gently muddle the strawberries to release their juices and create a pulp.\\n3. Add the aged cachaça, coconut cream, and lime juice to the shaker.\\n4. Fill the shaker with ice and shake vigorously for about 15 seconds until the outside is frosty.\\n5. Fill the rocks glass with crushed or pebble ice.\\n6. Strain the cocktail into the prepared glass.\\n7. Garnish with a whole strawberry on the rim.", "is_valid": true }"""

try:
    text = text.replace('```json', '').replace('```', '').strip()
    text = re.sub(r'\[\d+\]', '', text)
    data = json.loads(text)
    print("SUCCESS")
except Exception as e:
    print("FAILED:", e)

