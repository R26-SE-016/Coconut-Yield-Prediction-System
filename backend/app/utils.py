import datetime

def format_timestamp(ts):
    """Format datetime objects to ISO strings"""
    if isinstance(ts, datetime.datetime):
        return ts.isoformat()
    return ts

def get_current_season(month):
    """Example utility to determine season based on month"""
    month = str(month).lower()
    if month in ['december', 'january', 'february']:
        return 'Northeast Monsoon'
    elif month in ['may', 'june', 'july', 'august', 'september']:
        return 'Southwest Monsoon'
    else:
        return 'Inter-monsoon'
