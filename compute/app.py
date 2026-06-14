"""
大气辐射传输计算服务
基于简化的逐线积分模型
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import time
import threading
import uuid

from radiative_transfer.model import RadiativeTransferModel

app = Flask(__name__)
CORS(app)

computing_tasks = {}
results_cache = {}


def run_simulation_async(task_id: str, params: dict):
    try:
        computing_tasks[task_id]['status'] = 'running'
        computing_tasks[task_id]['progress'] = 10

        model = RadiativeTransferModel(
            wavelength_min=params.get('wavelength_min', 0.4),
            wavelength_max=params.get('wavelength_max', 2.5),
            spectral_resolution=params.get('spectral_resolution', 0.01),
            surface_type=params.get('surface_type', 'vegetation'),
            aerosol_model=params.get('aerosol_model', 'continental'),
            observation_angle=params.get('observation_angle', 0.0),
        )

        computing_tasks[task_id]['progress'] = 30
        time.sleep(0.5)

        computing_tasks[task_id]['progress'] = 50
        time.sleep(0.5)

        computing_tasks[task_id]['progress'] = 70
        results = model.run_simulation()

        computing_tasks[task_id]['progress'] = 90
        time.sleep(0.3)

        computing_tasks[task_id]['status'] = 'completed'
        computing_tasks[task_id]['progress'] = 100
        computing_tasks[task_id]['result'] = results
        results_cache[task_id] = results

    except Exception as e:
        computing_tasks[task_id]['status'] = 'failed'
        computing_tasks[task_id]['error'] = str(e)


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'success': True,
        'message': '辐射传输计算服务运行正常',
        'version': '1.0.0'
    })


@app.route('/api/compute/simulate', methods=['POST'])
def start_simulation():
    try:
        params = request.get_json()
        
        task_id = f"sim_{uuid.uuid4().hex[:8]}"
        
        computing_tasks[task_id] = {
            'id': task_id,
            'status': 'queued',
            'progress': 0,
            'params': params,
            'result': None,
            'created_at': time.time()
        }
        
        thread = threading.Thread(target=run_simulation_async, args=(task_id, params))
        thread.start()
        
        return jsonify({
            'success': True,
            'data': {
                'task_id': task_id,
                'status': 'queued',
                'message': '模拟任务已提交'
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/compute/status/<task_id>', methods=['GET'])
def get_simulation_status(task_id: str):
    if task_id not in computing_tasks:
        return jsonify({
            'success': False,
            'error': '任务不存在'
        }), 404
    
    task = computing_tasks[task_id]
    return jsonify({
        'success': True,
        'data': {
            'id': task['id'],
            'status': task['status'],
            'progress': task['progress'],
            'result': task.get('result') if task['status'] == 'completed' else None,
            'error': task.get('error')
        }
    })


@app.route('/api/compute/transmittance', methods=['POST'])
def calculate_transmittance():
    try:
        params = request.get_json()
        
        model = RadiativeTransferModel(
            wavelength_min=params.get('wavelength_min', 0.4),
            wavelength_max=params.get('wavelength_max', 2.5),
            spectral_resolution=params.get('spectral_resolution', 0.01),
            aerosol_model=params.get('aerosol_model', 'continental'),
            observation_angle=params.get('observation_angle', 0.0),
        )
        
        wavelengths, transmittance = model.calculate_transmittance()
        
        return jsonify({
            'success': True,
            'data': {
                'wavelengths': wavelengths.tolist(),
                'transmittance': transmittance.tolist()
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/compute/reflectance', methods=['POST'])
def calculate_reflectance():
    try:
        params = request.get_json()
        
        model = RadiativeTransferModel(
            wavelength_min=params.get('wavelength_min', 0.4),
            wavelength_max=params.get('wavelength_max', 2.5),
            spectral_resolution=params.get('spectral_resolution', 0.01),
            surface_type=params.get('surface_type', 'vegetation'),
            aerosol_model=params.get('aerosol_model', 'continental'),
            observation_angle=params.get('observation_angle', 0.0),
        )
        
        wavelengths, reflectance = model.calculate_reflectance()
        
        return jsonify({
            'success': True,
            'data': {
                'wavelengths': wavelengths.tolist(),
                'reflectance': reflectance.tolist()
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/compute/brightness-temp', methods=['POST'])
def calculate_brightness_temp():
    try:
        params = request.get_json()
        
        model = RadiativeTransferModel(
            wavelength_min=params.get('wavelength_min', 0.4),
            wavelength_max=params.get('wavelength_max', 15.0),
            spectral_resolution=params.get('spectral_resolution', 0.01),
            surface_type=params.get('surface_type', 'vegetation'),
            aerosol_model=params.get('aerosol_model', 'continental'),
            observation_angle=params.get('observation_angle', 0.0),
        )
        
        channels = params.get('channels', [
            {'channel': 'VIS_01', 'wavelength': 0.55},
            {'channel': 'TIR_01', 'wavelength': 10.8},
            {'channel': 'TIR_02', 'wavelength': 12.0},
        ])
        
        brightness_temp = model.calculate_brightness_temperature(channels)
        
        return jsonify({
            'success': True,
            'data': {
                'brightness_temperature': brightness_temp
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/compute/surface-types', methods=['GET'])
def get_surface_types():
    types = [
        {'id': 'vegetation', 'name': '植被', 'description': '典型植被覆盖地表'},
        {'id': 'water', 'name': '水体', 'description': '海洋、湖泊等水体'},
        {'id': 'desert', 'name': '沙漠', 'description': '沙漠、戈壁等干旱地区'},
        {'id': 'urban', 'name': '城市', 'description': '城市建筑、道路等'},
        {'id': 'snow', 'name': '冰雪', 'description': '积雪、冰川覆盖'},
        {'id': 'farmland', 'name': '农田', 'description': '耕地、农作物'},
    ]
    return jsonify({
        'success': True,
        'data': types
    })


@app.route('/api/compute/aerosol-models', methods=['GET'])
def get_aerosol_models():
    models = [
        {'id': 'continental', 'name': '大陆型', 'description': '标准大陆气溶胶'},
        {'id': 'marine', 'name': '海洋型', 'description': '海洋性气溶胶'},
        {'id': 'urban', 'name': '城市型', 'description': '城市污染气溶胶'},
        {'id': 'dust', 'name': '沙尘型', 'description': '沙尘天气气溶胶'},
        {'id': 'biomass_burning', 'name': '生物质燃烧型', 'description': '生物质燃烧气溶胶'},
    ]
    return jsonify({
        'success': True,
        'data': models
    })


if __name__ == '__main__':
    port = int(os.environ.get('COMPUTE_PORT', 5001))
    print(f"辐射传输计算服务启动在端口 {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
