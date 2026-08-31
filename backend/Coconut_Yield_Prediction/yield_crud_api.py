import firebase_admin
from firebase_admin import credentials, db
from flask import Blueprint, request, jsonify
import uuid
import time

yield_crud_bp = Blueprint('yield_crud', __name__)

# Initialize Firebase if not already initialized
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate('serviceAccountKey.json')
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://cococastai-b4682-default-rtdb.firebaseio.com'
        })
        print("Firebase Admin initialized successfully in CRUD API.")
    except Exception as e:
        print("Failed to initialize Firebase Admin:", e)

@yield_crud_bp.route('/api/yield/farms', methods=['GET', 'POST'])
def handle_farms():
    uid = request.args.get('uid') or (request.json and request.json.get('uid'))
    if not uid:
        return jsonify({"error": "Missing uid"}), 400
        
    ref = db.reference(f'trees/{uid}')
    
    if request.method == 'GET':
        data = ref.get() or {}
        farms = []
        for farm_id, farm_data in data.items():
            if 'farmDetails' in farm_data:
                farm = farm_data['farmDetails']
                farm['id'] = farm_id
                farms.append(farm)
        return jsonify({"farms": farms})
        
    if request.method == 'POST':
        farm_data = request.json.get('farm', {})
        farm_id = str(uuid.uuid4())
        farm_data['createdAt'] = int(time.time() * 1000)
        
        # Save tree layout if present
        if 'treeLayout' in farm_data:
            layout = farm_data.pop('treeLayout')
            trees_dict = {}
            for t in layout:
                tree_id = t["id"]
                trees_dict[tree_id] = {
                    "id": tree_id,
                    "number": t.get("number"),
                    "nx": t.get("nx"),
                    "nz": t.get("nz"),
                    "label": f"Tree {t.get('number')}",
                    "latest": None,
                    "history": {}
                }
            # Save all trees in one batch!
            db.reference(f'trees/{uid}/{farm_id}/trees').set(trees_dict)
        
        # Save to DB
        farm_ref = db.reference(f'trees/{uid}/{farm_id}/farmDetails')
        farm_ref.set(farm_data)
        
        return jsonify({"id": farm_id})

@yield_crud_bp.route('/api/yield/farms/<farm_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_farm_single(farm_id):
    uid = request.args.get('uid') or (request.json and request.json.get('uid'))
    if not uid:
        return jsonify({"error": "Missing uid"}), 400
        
    ref = db.reference(f'trees/{uid}/{farm_id}/farmDetails')
    
    if request.method == 'GET':
        data = ref.get()
        if data:
            data['id'] = farm_id
        return jsonify({"farm": data})
        
    if request.method == 'PUT':
        patch = request.json.get('patch', {})
        if patch:
            ref.update(patch)
        return jsonify({"success": True})
        
    if request.method == 'DELETE':
        db.reference(f'trees/{uid}/{farm_id}').delete()
        return jsonify({"success": True})

@yield_crud_bp.route('/api/yield/farms/<farm_id>/zones', methods=['GET', 'POST'])
def handle_zones(farm_id):
    uid = request.args.get('uid') or (request.json and request.json.get('uid'))
    if not uid:
        return jsonify({"error": "Missing uid"}), 400
        
    ref = db.reference(f'trees/{uid}/{farm_id}/zones')
    
    if request.method == 'GET':
        data = ref.get() or {}
        zones = []
        for zone_id, zone_data in data.items():
            zone_data['id'] = zone_id
            zones.append(zone_data)
        return jsonify({"zones": zones})
        
    if request.method == 'POST':
        zone_data = request.json.get('zone', {})
        zone_id = str(uuid.uuid4())
        zone_data['createdAt'] = int(time.time() * 1000)
        ref.child(zone_id).set(zone_data)
        return jsonify({"id": zone_id})

@yield_crud_bp.route('/api/yield/farms/<farm_id>/zones/<zone_id>', methods=['PUT', 'DELETE'])
def handle_zone_single(farm_id, zone_id):
    uid = request.args.get('uid') or (request.json and request.json.get('uid'))
    if not uid:
        return jsonify({"error": "Missing uid"}), 400
        
    ref = db.reference(f'trees/{uid}/{farm_id}/zones/{zone_id}')
    
    if request.method == 'PUT':
        patch = request.json.get('patch', {})
        if patch:
            ref.update(patch)
        return jsonify({"success": True})
        
    if request.method == 'DELETE':
        ref.delete()
        return jsonify({"success": True})

@yield_crud_bp.route('/api/yield/farms/<farm_id>/trees', methods=['GET'])
def get_trees(farm_id):
    uid = request.args.get('uid')
    if not uid:
        return jsonify({"error": "Missing uid"}), 400
        
    ref = db.reference(f'trees/{uid}/{farm_id}/trees')
    data = ref.get() or {}
    return jsonify({"trees": data})

@yield_crud_bp.route('/api/yield/farms/<farm_id>/trees/<tree_id>', methods=['GET', 'PUT'])
def handle_tree_single(farm_id, tree_id):
    uid = request.args.get('uid') or (request.json and request.json.get('uid'))
    if not uid:
        return jsonify({"error": "Missing uid"}), 400
        
    ref = db.reference(f'trees/{uid}/{farm_id}/trees/{tree_id}')
    
    if request.method == 'GET':
        data = ref.get()
        return jsonify({"tree": data})
        
    if request.method == 'PUT':
        patch = request.json.get('patch', {})
        if patch:
            ref.update(patch)
        else:
            # Upsert full tree
            tree = request.json.get('tree', {})
            if tree:
                ref.set(tree)
        return jsonify({"success": True})

@yield_crud_bp.route('/api/yield/farms/<farm_id>/trees/<tree_id>/history', methods=['POST'])
def handle_tree_history(farm_id, tree_id):
    uid = request.json.get('uid')
    record = request.json.get('record', {})
    ref = db.reference(f'trees/{uid}/{farm_id}/trees/{tree_id}/history')
    new_ref = ref.push(record)
    return jsonify({"key": new_ref.key})

@yield_crud_bp.route('/api/yield/farms/<farm_id>/harvests', methods=['GET', 'POST'])
def handle_harvests(farm_id):
    uid = request.args.get('uid') or (request.json and request.json.get('uid'))
    if not uid:
        return jsonify({"error": "Missing uid"}), 400
        
    ref = db.reference(f'users/{uid}/harvests/{farm_id}')
    
    if request.method == 'GET':
        data = ref.get() or {}
        logs = []
        for log_id, log_data in data.items():
            log_data['id'] = log_id
            logs.append(log_data)
        return jsonify({"logs": logs})
        
    if request.method == 'POST':
        log_data = request.json.get('log', {})
        log_id = request.json.get('logId') or str(uuid.uuid4())
        ref.child(log_id).set(log_data)
        return jsonify({"id": log_id})

@yield_crud_bp.route('/api/yield/farms/<farm_id>/harvests/<log_id>', methods=['DELETE'])
def delete_harvest(farm_id, log_id):
    uid = request.args.get('uid')
    ref = db.reference(f'users/{uid}/harvests/{farm_id}/{log_id}')
    ref.delete()
    return jsonify({"success": True})
