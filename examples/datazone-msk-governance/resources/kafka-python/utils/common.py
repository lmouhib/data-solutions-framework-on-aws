import yaml
from openlineage.client import OpenLineageClient
from openlineage.client.run import RunEvent, RunState, Run, Job, Dataset
from openlineage.client.facet import SchemaDatasetFacet
from datetime import datetime,timezone
from custom_transport import DataZoneTransport, DataZoneConfig

import json
from typing import List

def load_config() -> dict:
    """Load the configuration from config.yaml."""
    with open('config.yaml', 'r') as config_file:
        return yaml.safe_load(config_file)

def create_openlineage_client() -> OpenLineageClient:
    """Create and return an OpenLineage client based on the transport type."""
    config = load_config()

    if config['openlineage']['transport_type'] == 'datazone':
        # Fetch the domain_id for DataZone from the config file
        datazone_config = DataZoneConfig(domain_id=config['openlineage']['domain_id'],region=config['openlineage']['region'])
        transport = DataZoneTransport(datazone_config)

    return OpenLineageClient(transport=transport)

def get_schema_facet(schema_file_path: str) -> SchemaDatasetFacet:
    """Extract schema information for OpenLineage Dataset Facet."""
    with open(schema_file_path, 'r') as schema_file:
        schema_definition = json.load(schema_file)

    schema_fields = [{'name': field['name'], 'type': field['type']} for field in schema_definition['fields']]
    return SchemaDatasetFacet(fields=schema_fields)

def create_datasets(schema_facet: SchemaDatasetFacet, dataset_type: str = "output") -> list:
    """Create datasets for OpenLineage events, categorized by dataset_type ('input' or 'output')."""
    config = load_config()
    cluster_name = config['kafka']['cluster_name']
    topic_name = config['kafka']['topic']

    dataset = {
        'namespace': f"kafka://{cluster_name}",
        'name': topic_name,
        'facets': {'schema': schema_facet}
    }

    return [dataset]

def emit_event(client: OpenLineageClient, run_id: str, job_name: str, state: str, producer: str, datasets: List[Dataset], dataset_type: str):
    """Emit OpenLineage event with either input or output datasets."""
    config = load_config()
    cluster_name = config['kafka']['cluster_name']

    # Create Job and Run objects
    job = Job(namespace=f"{cluster_name}", name=job_name)
    run = Run(run_id)

    # Determine whether datasets are inputs or outputs
    if dataset_type == 'input':
        inputs = datasets
        outputs = []
    else:
        inputs = []
        outputs = datasets

    # Create the event with producer
    run_event = RunEvent(
        RunState[state],
        datetime.now(timezone.utc).isoformat(),
        run=run,
        job=job,
        producer=producer,
        inputs=inputs,
        outputs=outputs
    )

    client.emit(run_event)