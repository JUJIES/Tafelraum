import unittest
import numpy as np
from perspective import rectify_pair


class PerspectiveTest(unittest.TestCase):
    def setUp(self):
        yy, xx = np.mgrid[:240, :320]
        # Continuous coordinate channels: a modulo jump at x=256 would make
        # bilinear interpolation differ from the analytical corner coordinate.
        self.image = np.stack((xx // 2, yy, (xx+yy) % 256), axis=-1).astype(np.uint8)
        self.whole = [dict(x=0,y=0),dict(x=1,y=0),dict(x=1,y=1),dict(x=0,y=1)]

    def test_identity_retains_all_pixels_and_dimensions(self):
        first, second = rectify_pair(self.image, self.image.copy(), self.whole)
        np.testing.assert_array_equal(first, self.image)
        np.testing.assert_array_equal(second, first)

    def test_trapezoid_corners_map_to_rectangular_corners(self):
        quad = [dict(x=.2,y=.1),dict(x=.8,y=.2),dict(x=.95,y=.9),dict(x=.05,y=.8)]
        first, second = rectify_pair(self.image, self.image, quad)
        np.testing.assert_array_equal(first, second)
        for target,point in zip([first[0,0],first[0,-1],first[-1,-1],first[-1,0]],quad):
            x,y=point['x']*319,point['y']*239
            self.assertLess(abs(float(target[0])-x/2),2)
            self.assertLess(abs(float(target[1])-y),2)

    def test_bad_geometry_and_mismatched_pair_are_rejected(self):
        for quad in [self.whole[::-1],self.whole[:3],[self.whole[0]]*4,
                     [dict(x=-.1,y=0),*self.whole[1:]], [dict(x=float('nan'),y=0),*self.whole[1:]]]:
            with self.assertRaises(ValueError):
                rectify_pair(self.image,self.image,quad)
        with self.assertRaises(ValueError):
            rectify_pair(self.image,self.image[:100],self.whole)


if __name__ == '__main__':
    unittest.main()
