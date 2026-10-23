import unittest
import pandas as pd
from notebooks.quality_checks import merge_song_metadata, report_date

class QualityTests(unittest.TestCase):
    def setUp(self):
        self.fact=pd.DataFrame({'Song':['A','A'],'Date':pd.to_datetime(['2025-01-01','2025-01-02'])})
    def test_dimension_does_not_multiply_facts(self):
        with self.assertRaises(ValueError):merge_song_metadata(self.fact,pd.DataFrame({'SongName':['A','A']}))
    def test_unmatched_song_fails(self):
        with self.assertRaises(ValueError):merge_song_metadata(self.fact,pd.DataFrame({'SongName':['B']}))
    def test_default_date_is_source_date(self):
        self.assertEqual(report_date(self.fact),pd.Timestamp('2025-01-02'))
    def test_report_date_cannot_precede_data(self):
        with self.assertRaises(ValueError):report_date(self.fact,'2024-01-01')

if __name__=='__main__':unittest.main()
