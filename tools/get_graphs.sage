import json
from sage.all import *

MAX_ORDER = 50

def generate_cayley_data(max_order):
    group_data = []
    print(f"Starting generation for groups up to order {max_order}...")

    for n in range(1, int(max_order) + 1):
        try:
            num_groups = int(gap.NumberSmallGroups(n))

            for i in range(1, num_groups + 1):
                try:
                    # Special handling for Trivial Group (Order 1)
                    if n == 1:
                        group_data.append({
                            "id": "1_1",
                            "name": "Trivial Group",
                            "order": int(1),
                            "generators": ["()"],
                            "nodes": ["()"],
                            "edges": [{
                                "source": "()", 
                                "target": "()", 
                                "gen_index": int(0)
                            }]
                        })
                        continue

                    # Standard handling
                    G = SmallPermutationGroup(n, i)
                    name = str(G.structure_description())
                    
                    generators = G.gens()
                    gen_labels = [str(g) for g in generators]
                    
                    cayley = G.cayley_graph(generators=generators)
                    
                    nodes = [str(v) for v in cayley.vertices()]
                    
                    edges = []
                    for u, v, label in cayley.edges():
                        try:
                            gen_index = generators.index(label)
                        except ValueError:
                            gen_index = int(-1)
                            
                        edges.append({
                            "source": str(u),
                            "target": str(v),
                            "gen_index": gen_index
                        })

                    group_data.append({
                        "id": f"{n}_{i}",
                        "name": name,
                        "order": int(n),
                        "generators": gen_labels,
                        "nodes": nodes,
                        "edges": edges
                    })
                    
                except Exception as inner_e:
                    print(f"  Skipped Group {n},{i}: {inner_e}")
            
            print(f"Finished order {n} ({num_groups} groups)")
            
        except Exception as e:
            print(f"Error processing order {n}: {e}")

    output_file = 'cayley_graphs.json'
    with open(output_file, 'w') as f:
        json.dump(group_data, f, indent=2)
    
    print(f"\nSUCCESS! Data saved to {output_file}")

if __name__ == "__main__":
    generate_cayley_data(MAX_ORDER)