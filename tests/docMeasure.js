var assert = require('assert');

var DocMeasure = require('../src/docMeasure');
var StyleContextStack = require('../src/styleContextStack');

var sampleTestProvider = {
	provideFont: function(familyName, bold, italics) {
		return {
			widthOfString: function(text, size) {
				return text.length * size * (bold ? 1.5 : 1) * (italics ? 1.1 : 1);
			},
			lineHeight: function(size) {
				return size;
			}
		}
	}
};

var emptyTableLayout = {
	hLineWidth: function(i) { return 0; },
	vLineWidth: function(i) { return 0; },
	hLineColor: function(i) { return 'black'; },
	vLineColor: function(i) { return 'black'; },
	paddingLeft: function(i) { return 0; },
	paddingRight: function(i) { return 0; },
	paddingTop: function(i) { return 0; },
	paddingBottom: function(i) { return 0; }
};

var docMeasure = new DocMeasure(sampleTestProvider);

describe('DocMeasure', function() {
	describe('measureLeaf', function() {
		it('should call textTools.buildInlines and set _inlines, _minWidth, _maxWidth and return node', function() {
			var dm = new DocMeasure(sampleTestProvider);
			var called = false;
			var node = { text: 'abc' };

			dm.textTools = {
				buildInlines: function() {
					called = true;
					return { items: [ 'abc' ], minWidth: 1, maxWidth: 10 };
				}
			}

			var result = dm.measureLeaf(node);
			assert(called);
			assert(node._inlines);
			assert(node._minWidth);
			assert(node._maxWidth);

			assert.equal(node._inlines.length, 1);
			assert.equal(node._minWidth, 1);
			assert.equal(node._maxWidth, 10);

			assert.equal(node, result);
		});
	});

	describe('measureColumns', function() {
		it('should extend document-definition-object if text columns are used', function() {
			var result = docMeasure.measureColumns({ columns: [ 'asdasd', 'bbbb' ]});

			assert(result.columns[0]._minWidth);
			assert(result.columns[0]._maxWidth);
		});

		it('should calculate _minWidth and _maxWidth of all columns', function() {
			var result = docMeasure.measureColumns({ columns: [ 'this is a test', 'another one' ]});

			assert.equal(result.columns[0]._minWidth, 4 * 12);
			assert.equal(result.columns[0]._maxWidth, 14 * 12);
			assert.equal(result.columns[1]._minWidth, 7 * 12);
			assert.equal(result.columns[1]._maxWidth, 11 * 12);
		});

		it('should set _minWidth and _maxWidth to the sum of inner min/max widths', function() {
			var node = { columns: [ 'this is a test', 'another one' ]};
			var result = docMeasure.measureColumns(node);

			assert.equal(node._minWidth, 4*12 + 7*12);
			assert.equal(node._maxWidth, 14*12 + 11*12);
		});
	});

	describe('measureVerticalContainer', function() {
		it('should extend document-definition-object if text paragraphs are used', function() {
			var result = docMeasure.measureVerticalContainer({ stack: [ 'asdasd', 'bbbb' ]});

			assert(result.stack[0]._minWidth);
			assert(result.stack[0]._maxWidth);
		});

		it('should calculate _minWidth and _maxWidth of all elements', function() {
			var result = docMeasure.measureVerticalContainer({ stack: [ 'this is a test', 'another one' ]});

			assert.equal(result.stack[0]._minWidth, 4 * 12);
			assert.equal(result.stack[0]._maxWidth, 14 * 12);
			assert.equal(result.stack[1]._minWidth, 7 * 12);
			assert.equal(result.stack[1]._maxWidth, 11 * 12);
		});

		it('should set _minWidth and _maxWidth to the max of inner min/max widths', function() {
			var node = { stack: [ 'this is a test', 'another one' ]};
			var result = docMeasure.measureVerticalContainer(node);

			assert.equal(node._minWidth, 7*12);
			assert.equal(node._maxWidth, 14*12);
		});
	});

	describe('measureList', function() {
		it('should extend document-definition-object if text items are used', function() {
			var result = docMeasure.measureList(true, { ol: [ 'asdasd', 'bbbb' ]});

			assert(result.ol[0]._minWidth);
			assert(result.ol[0]._maxWidth);

			result = docMeasure.measureList(false, { ul: [ 'asdasd', 'bbbb' ]});

			assert(result.ul[0]._minWidth);
			assert(result.ul[0]._maxWidth);

			assert(result._gapSize);
		});

		it('should calculate _minWidth and _maxWidth of all elements', function() {
			var result = docMeasure.measureList(true, { ol: [ 'this is a test', 'another one' ]});

			assert.equal(result.ol[0]._minWidth, 4 * 12);
			assert.equal(result.ol[0]._maxWidth, 14 * 12);
			assert.equal(result.ol[1]._minWidth, 7 * 12);
			assert.equal(result.ol[1]._maxWidth, 11 * 12);
		});

		it('should set _minWidth and _maxWidth to the max of inner min/max widths + gapSize', function() {
			var node = { ol: [ 'this is a test', 'another one' ]};
			var result = docMeasure.measureList(true, node);

			assert(node, result);
			assert(node._gapSize.width > 0);
			assert.equal(node._minWidth, 7*12 + node._gapSize.width);
			assert.equal(node._maxWidth, 14*12 + node._gapSize.width);
		});
	});

	describe('measureTable', function() {
		var tableNode;

		beforeEach(function() {
			tableNode = {
				table: {
					headerLines: 1,
					widths: [ '*', 150, 'auto', 'auto' ],
					body:
					[
						[ 'Header 1', 'H2', 'Header\nwith\nlines', { text: 'last', fontSize: 20 } ],
						[ 'Column 1', 'Column 2', 'Column 3', 'Column 4' ],
						[ 'A text in the first column', 'Text in the second one', 'Other things go here', 'or here' ]
					]
				}
			};
		});

		it('should extend document-definition-object', function() {
			var result = docMeasure.measureTable(tableNode);

			assert(result.table.body[0][0]._minWidth);
			assert(result.table.body[0][0]._maxWidth);
			assert(result.table.body[0][3]._minWidth);
			assert(result.table.body[0][3]._maxWidth);
			assert(result.table.widths[0]._maxWidth);
			assert(result.table.widths[0]._minWidth);
			assert(result.table.widths[0].width);
		});

		it('should not spoil widths if measureTable has been called before', function() {
			var result = docMeasure.measureTable(tableNode);
			result = docMeasure.measureTable(result);

			assert(result.table.widths[0]._maxWidth);
			assert(result.table.widths[0]._minWidth);
			assert(result.table.widths[0].width);
			assert.equal(result.table.widths[0].width, '*');
		});

		it('should calculate _minWidth and _maxWidth for all columns', function() {
			var result = docMeasure.measureTable(tableNode);

			result.table.widths.forEach(function(width){
				assert(width._maxWidth);
				assert(width._minWidth);
				assert(width.width);
			});
		});

		it('should set _minWidth and _maxWidth of each column to min/max width or the largest cell', function() {
			docMeasure.measureTable(tableNode);

			assert.equal(tableNode.table.widths[0]._minWidth, 6*12);
			assert.equal(tableNode.table.widths[0]._maxWidth, 26*12);
		});

		it('should support single-width-definition and extend it to an array of widths', function() {
			var node = {
				table: {
					headerLines: 1,
					widths: 'auto',
					body:
					[
						[ 'Header 1', 'H2', 'Header\nwith\nlines', { text: 'last', fontSize: 20 } ],
						[ 'Column 1', 'Column 2', 'Column 3', 'Column 4' ],
						[ 'A text in the first column', 'Text in the second one', 'Other things go here', 'or here' ]
					]
				}
			};

			docMeasure.measureTable(node);

			assert(node.table.widths instanceof Array);
			assert.equal(node.table.widths.length, 4);
			node.table.widths.forEach(function(w) { assert.equal(w.width, 'auto'); });
		});

		it('should set _minWidth and _maxWidth to the sum of column min/max widths', function() {
			var result = docMeasure.measureTable(tableNode);

			assert.equal(tableNode.table._minWidth, 296);
			assert.equal(tableNode.table._maxWidth, 912);
		});

		it('should support column spans', function() {
			tableNode.table.body.push([ { text: 'Column 1', colSpan: 2 }, {}, 'Column 3', 'Column 4' ]);

			docMeasure.measureTable(tableNode);
		});

		it('spanning cells should not influence min/max column widths if their min/max widths are lower or equal', function() {
			tableNode.layout = emptyTableLayout;

			docMeasure.measureTable(tableNode);
			var col0min = tableNode.table.widths[0]._minWidth;
			var col0max = tableNode.table.widths[0]._maxWidth;
			var col1min = tableNode.table.widths[1]._minWidth;
			var col1max = tableNode.table.widths[1]._maxWidth;

			tableNode.table.body.push([ { text: 'Co1', colSpan: 2 }, {}, 'Column 3', 'Column 4' ]);
			tableNode.table.body.push([ { text: '123456789012', colSpan: 2 }, {}, 'Column 3', 'Column 4' ]);
			docMeasure.measureTable(tableNode);

			assert.equal(tableNode.table.widths[0]._minWidth, col0min);
			assert.equal(tableNode.table.widths[0]._maxWidth, col0max);
			assert.equal(tableNode.table.widths[1]._minWidth, col1min);
			assert.equal(tableNode.table.widths[1]._maxWidth, col1max);
		});

		it('spanning cells, having min-width larger than the sum of min-widths of the columns they span over, should update column min-widths equally', function() {
			tableNode.layout = emptyTableLayout;

			docMeasure.measureTable(tableNode);
			var col0min = tableNode.table.widths[0]._minWidth;
			var col1min = tableNode.table.widths[1]._minWidth;

			assert.equal(col0min, 6 * 12);
			assert.equal(col1min, 6 * 12);

			// make sure we know default values for

			tableNode.table.body.push([ { text: 'thisislongera', colSpan: 2 }, {}, 'Column 3', 'Column 4' ]);
			docMeasure.measureTable(tableNode);

			assert(tableNode.table.widths[0]._minWidth > col0min);
			assert(tableNode.table.widths[1]._minWidth > col1min);

			assert.equal(tableNode.table.widths[0]._minWidth, col1min + 1 * 12 / 2);
			assert.equal(tableNode.table.widths[1]._minWidth, col1min + 1 * 12 / 2);
		});

		it('spanning cells, having max-width larger than the sum of max-widths of the columns they span over, should update column max-widths equally', function() {
			tableNode.layout = emptyTableLayout;

			docMeasure.measureTable(tableNode);
			var col0max = tableNode.table.widths[0]._maxWidth;
			var col1max = tableNode.table.widths[1]._maxWidth;

			assert.equal(col0max, 26 * 12);
			assert.equal(col1max, 22 * 12);

			tableNode.table.body.push([ { text: '1234 6789 1234 6789 1234 6789 1234 6789 1234 6789', colSpan: 2 }, {}, 'Column 3', 'Column 4' ]);
			docMeasure.measureTable(tableNode);

			assert.equal(tableNode.table.widths[0]._maxWidth, col0max + 1 * 12/2);
			assert.equal(tableNode.table.widths[1]._maxWidth, col1max + 1 * 12/2);
		});

		it('calculating widths (when colSpan are used) should take into account cell padding and borders', function() {
			// 5 + 3 + 4 == 12 --- the exact width of the overflowing letter in thisislongera
			// it means we have enough space and there's no need to change column widths
			tableNode.layout = {
				vLineWidth: function() { return 5; },
				paddingLeft: function() { return 3; },
				paddingRight: function() { return 4; }
			};

			docMeasure.measureTable(tableNode);
			var col0min = tableNode.table.widths[0]._minWidth;
			var col1min = tableNode.table.widths[1]._minWidth;

			assert.equal(col0min, 6 * 12);
			assert.equal(col1min, 6 * 12);

			tableNode.table.body.push([ { text: 'thisislongera', colSpan: 2 }, {}, 'Column 3', 'Column 4' ]);
			docMeasure.measureTable(tableNode);

			assert.equal(tableNode.table.widths[0]._minWidth, col0min);
			assert.equal(tableNode.table.widths[1]._minWidth, col1min);
		});
	});
});
