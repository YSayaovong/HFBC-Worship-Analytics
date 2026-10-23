import pandas as pd

def merge_song_metadata(fact, dimension):
    if dimension['SongName'].isna().any() or dimension['SongName'].duplicated().any():
        raise ValueError('Song dimension requires unique non-null SongName values')
    if fact['Song'].isna().any() or fact['Date'].isna().any():
        raise ValueError('Song and Date must be populated')
    joined=fact.merge(dimension,left_on='Song',right_on='SongName',how='left',validate='many_to_one',indicator=True)
    if joined['_merge'].ne('both').any():
        raise ValueError('Some fact songs have no dimension record')
    return joined.drop(columns='_merge')

def report_date(fact, as_of=None):
    date=pd.Timestamp(as_of).normalize() if as_of else fact['Date'].max().normalize()
    if pd.isna(date) or date < fact['Date'].max().normalize():
        raise ValueError('Reporting date must be on or after the last source date')
    return date
