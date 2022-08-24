export const testHighlights = [
    {
        "content": {
            "text": "Diversity of transfer types To make NLP models broadly useful, few-shot NLP techniques must becapable of class, domain, and task transfer. Moreover, techniques should make use of the relevantsupervision provided during meta-training to increase performance compared to the pretrainingtransfer setting. The benchmark should measure all four transfer settings to ensure that the communitydevelops techniques that improve on strong pretraining transfer baselines, and enable comparisonacross these currently separate threads of research."
        },
        "position": {
            "boundingRect": {
                "x1": 163.9310302734375,
                "y1": 496.3333740234375,
                "x2": 928.9962158203125,
                "y2": 596.6254272460938,
                "width": 929,
                "height": 1202.235294117647,
                "pageNumber": 4
            },
            "rects": [
                {
                    "x1": 163.9345703125,
                    "y1": 496.3333740234375,
                    "x2": 928.51708984375,
                    "y2": 513.8333740234375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 4
                },
                {
                    "x1": 163.9361572265625,
                    "y1": 512.8910522460938,
                    "x2": 765.055908203125,
                    "y2": 530.3910522460938,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 4
                },
                {
                    "x1": 163.9344482421875,
                    "y1": 529.4535522460938,
                    "x2": 928.9962158203125,
                    "y2": 546.9535522460938,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 4
                },
                {
                    "x1": 163.9345703125,
                    "y1": 546.0082397460938,
                    "x2": 765.361572265625,
                    "y2": 563.5082397460938,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 4
                },
                {
                    "x1": 163.93701171875,
                    "y1": 562.5707397460938,
                    "x2": 765.05517578125,
                    "y2": 580.0707397460938,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 4
                },
                {
                    "x1": 163.9310302734375,
                    "y1": 579.1254272460938,
                    "x2": 470.05419921875,
                    "y2": 596.6254272460938,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 4
                }
            ],
            "pageNumber": 4
        },
        "comment": {
            "text": "1:55 - 2:08 - 0",
            "emoji": ""
        },
        "id": "0037948855404652537"
    },
    {
        "content": {
            "text": "Let D be a dataset of (x,y) examples with full label set YD. From it, we construct three sets ofepisodes, corresponding to meta-training, meta-validation, and meta-testing and denoted by Etrain,Eval, and Etest, respectively. Each episode in each of these sets is a few-shot problem with its own testset and other attributes. Formally, each episode E is a tuple (DEtrain,DEval,DEtest,YED), where YED is asampled subset of labels in YD and DEtrain|val|test are disjoint sets of examples from Dwith labels inYED.9 For each episode, the model’s objective is to correctly predict labels for examples DEtest. Toaccomplish this, models make use of labeled examples in DEtrain, which is typically configured suchthat each label i in YED has KEi provided examples; KEi is known as the shot, and the setting when aclass has no examples in DEtrain (i.e., KEi = 0) is called zero-shot."
        },
        "position": {
            "boundingRect": {
                "x1": 163.9306640625,
                "y1": 532.9349365234375,
                "x2": 928.994873046875,
                "y2": 707.0376586914062,
                "width": 929,
                "height": 1202.235294117647,
                "pageNumber": 3
            },
            "rects": [
                {
                    "x1": 163.9329833984375,
                    "y1": 532.9349365234375,
                    "x2": 928.9937744140625,
                    "y2": 550.4349365234375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 528.335205078125,
                    "y1": 539.3344116210938,
                    "x2": 535.983642578125,
                    "y2": 551.3344116210938,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.931884765625,
                    "y1": 549.4931640625,
                    "x2": 767.2861328125,
                    "y2": 566.9931640625,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 742.9296875,
                    "y1": 555.8984375,
                    "x2": 762.3455810546875,
                    "y2": 567.8984375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.933837890625,
                    "y1": 566.0551147460938,
                    "x2": 174.019775390625,
                    "y2": 583.5551147460938,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 184.9654541015625,
                    "y1": 566.8441772460938,
                    "x2": 928.9937744140625,
                    "y2": 584.3441772460938,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 171.921875,
                    "y1": 572.4609375,
                    "x2": 184.972900390625,
                    "y2": 584.4609375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 226.1484375,
                    "y1": 572.4609375,
                    "x2": 240.8607177734375,
                    "y2": 584.4609375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 550.2578125,
                    "y1": 581.265625,
                    "x2": 567.421875,
                    "y2": 593.265625,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 588.8046875,
                    "y1": 581.265625,
                    "x2": 599.234375,
                    "y2": 593.265625,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 620.6171875,
                    "y1": 581.265625,
                    "x2": 633.0859375,
                    "y2": 593.265625,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 653.734375,
                    "y1": 581.265625,
                    "x2": 660.796875,
                    "y2": 593.265625,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 730.1796875,
                    "y1": 581.265625,
                    "x2": 742.359375,
                    "y2": 593.265625,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 744.1796875,
                    "y1": 582.6098022460938,
                    "x2": 928.9921875,
                    "y2": 601.7348022460938,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.93310546875,
                    "y1": 582.6111450195312,
                    "x2": 549.5078125,
                    "y2": 601.7361450195312,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 569.2440185546875,
                    "y1": 583.3988647460938,
                    "x2": 588.05224609375,
                    "y2": 602.5238647460938,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 601.0560302734375,
                    "y1": 583.3988647460938,
                    "x2": 619.86474609375,
                    "y2": 602.5238647460938,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 634.9012451171875,
                    "y1": 583.3988647460938,
                    "x2": 729.323486328125,
                    "y2": 602.5238647460938,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 620.203125,
                    "y1": 590.484375,
                    "x2": 634.915283203125,
                    "y2": 602.484375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 549.8359375,
                    "y1": 590.859375,
                    "x2": 569.2518310546875,
                    "y2": 602.859375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 588.3828125,
                    "y1": 590.859375,
                    "x2": 601.060546875,
                    "y2": 602.859375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 652.484375,
                    "y1": 590.9140625,
                    "x2": 660.1328125,
                    "y2": 602.9140625,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 728.928955078125,
                    "y1": 590.9140625,
                    "x2": 744.193359375,
                    "y2": 602.9140625,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 396.0242919921875,
                    "y1": 599.9774169921875,
                    "x2": 452.4930419921875,
                    "y2": 611.9774169921875,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.9306640625,
                    "y1": 601.0632934570312,
                    "x2": 395.267578125,
                    "y2": 618.5632934570312,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 454.3203125,
                    "y1": 601.0672607421875,
                    "x2": 928.9892578125,
                    "y2": 620.5828857421875,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 343.796875,
                    "y1": 608.46875,
                    "x2": 358.099365234375,
                    "y2": 622.0546875,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 395.8125,
                    "y1": 610.0703125,
                    "x2": 454.334228515625,
                    "y2": 622.0703125,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 174.666748046875,
                    "y1": 620.0758666992188,
                    "x2": 765.0670166015625,
                    "y2": 642.7008666992188,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 724.2672119140625,
                    "y1": 621.4561767578125,
                    "x2": 731.3297119140625,
                    "y2": 633.4561767578125,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.933837890625,
                    "y1": 622.8195190429688,
                    "x2": 174.019775390625,
                    "y2": 640.3195190429688,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 723.8515625,
                    "y1": 630.6875,
                    "x2": 738.563720703125,
                    "y2": 642.6875,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 174.046875,
                    "y1": 631.1171875,
                    "x2": 181.6953125,
                    "y2": 643.1171875,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 528.4000244140625,
                    "y1": 640.150146484375,
                    "x2": 545.7672119140625,
                    "y2": 652.150146484375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.9366455078125,
                    "y1": 641.2173461914062,
                    "x2": 527.6412353515625,
                    "y2": 662.1626586914062,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 547.5955810546875,
                    "y1": 642.4962158203125,
                    "x2": 928.99365234375,
                    "y2": 661.0977783203125,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 528.1875,
                    "y1": 649.4609375,
                    "x2": 547.6033935546875,
                    "y2": 661.4609375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 341.103759765625,
                    "y1": 658.3048095703125,
                    "x2": 354.270751953125,
                    "y2": 670.3048095703125,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 489.478759765625,
                    "y1": 658.3048095703125,
                    "x2": 502.645751953125,
                    "y2": 670.3048095703125,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 288.3184814453125,
                    "y1": 658.5782470703125,
                    "x2": 301.7325439453125,
                    "y2": 670.5782470703125,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 303.5546875,
                    "y1": 658.5796508789062,
                    "x2": 928.994873046875,
                    "y2": 679.5562133789062,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.93310546875,
                    "y1": 659.6655883789062,
                    "x2": 288.296875,
                    "y2": 680.6421508789062,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 344.3046875,
                    "y1": 667.734375,
                    "x2": 355.122314453125,
                    "y2": 679.734375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 492.6796875,
                    "y1": 667.734375,
                    "x2": 503.497314453125,
                    "y2": 679.734375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 288.311767578125,
                    "y1": 667.9609375,
                    "x2": 303.5655517578125,
                    "y2": 679.9609375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 328.0555419921875,
                    "y1": 677.001708984375,
                    "x2": 342.4774169921875,
                    "y2": 689.001708984375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 396.248046875,
                    "y1": 677.001708984375,
                    "x2": 411.20703125,
                    "y2": 689.001708984375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 411.203125,
                    "y1": 677.003173828125,
                    "x2": 552.92333984375,
                    "y2": 707.034423828125,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 351.7890625,
                    "y1": 678.0636596679688,
                    "x2": 393.4921875,
                    "y2": 695.7511596679688,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 411.203125,
                    "y1": 678.065673828125,
                    "x2": 557.1171875,
                    "y2": 695.565673828125,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.93115234375,
                    "y1": 678.0689086914062,
                    "x2": 327.1015625,
                    "y2": 695.5689086914062,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 347.25,
                    "y1": 679.442138671875,
                    "x2": 399.9847412109375,
                    "y2": 707.028076171875,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 312.3984375,
                    "y1": 679.5610961914062,
                    "x2": 327.3046875,
                    "y2": 707.0376586914062,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 399.984375,
                    "y1": 686.1328125,
                    "x2": 411.226318359375,
                    "y2": 698.1328125,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 327.84375,
                    "y1": 686.3046875,
                    "x2": 351.7962646484375,
                    "y2": 698.3046875,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 399.984375,
                    "y1": 687.1328125,
                    "x2": 411.226318359375,
                    "y2": 707.03125,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 327.84375,
                    "y1": 687.3046875,
                    "x2": 347.2596435546875,
                    "y2": 707.03125,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                }
            ],
            "pageNumber": 3
        },
        "comment": {
            "text": "1:28 - 1:46 - 6",
            "emoji": ""
        },
        "id": "055070862686100064"
    },
    {
        "content": {
            "text": "meta-testing [21]. Very recent work has studied task transfer over a large set of datasets [75, 80]. Alimited amount of work evaluates both domain and task transfer [3, 4, 21]. An important emergingline of work (not noted by Yin [76]) is pretraining transfer, the problem of whether pretrainedlanguage models can perform well at meta-test time without any meta-training. Evaluation in thissetting requires Etrain,Eval = ∅. Prior work has shown that pretrained language models are capable ofsurprising performance on many few-shot tasks, even without fine-tuning [10]. More recent work,mainly focusing on text classification, has reported further gains with cloze-style formats [55, 56, 65],prompt engineering [24], or calibration [78]. FLEX is designed to exercise all four of these transfertypes from previous work."
        },
        "position": {
            "boundingRect": {
                "x1": 163.930419921875,
                "y1": 110.8056640625,
                "x2": 928.998291015625,
                "y2": 260.78173828125,
                "width": 929,
                "height": 1202.235294117647,
                "pageNumber": 4
            },
            "rects": [
                {
                    "x1": 163.9307861328125,
                    "y1": 110.8056640625,
                    "x2": 764.853271484375,
                    "y2": 128.3056640625,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 4
                },
                {
                    "x1": 163.931396484375,
                    "y1": 127.36761474609375,
                    "x2": 764.2862548828125,
                    "y2": 144.86761474609375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 4
                },
                {
                    "x1": 163.9306640625,
                    "y1": 143.93011474609375,
                    "x2": 928.998291015625,
                    "y2": 161.43011474609375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 4
                },
                {
                    "x1": 163.9317626953125,
                    "y1": 160.48480224609375,
                    "x2": 765.05029296875,
                    "y2": 177.98480224609375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 4
                },
                {
                    "x1": 163.93359375,
                    "y1": 177.04730224609375,
                    "x2": 928.995361328125,
                    "y2": 194.54730224609375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 4
                },
                {
                    "x1": 267.4453125,
                    "y1": 183.453125,
                    "x2": 286.8612060546875,
                    "y2": 195.453125,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 4
                },
                {
                    "x1": 302.3125,
                    "y1": 183.453125,
                    "x2": 319.950927734375,
                    "y2": 195.453125,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 4
                },
                {
                    "x1": 163.930419921875,
                    "y1": 193.6103515625,
                    "x2": 766.941650390625,
                    "y2": 211.1103515625,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 4
                },
                {
                    "x1": 163.9373779296875,
                    "y1": 210.16448974609375,
                    "x2": 766.946533203125,
                    "y2": 227.66448974609375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 4
                },
                {
                    "x1": 163.932373046875,
                    "y1": 226.72698974609375,
                    "x2": 765.305419921875,
                    "y2": 244.22698974609375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 4
                },
                {
                    "x1": 163.9324951171875,
                    "y1": 243.28167724609375,
                    "x2": 323.01318359375,
                    "y2": 260.78173828125,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 4
                }
            ],
            "pageNumber": 4
        },
        "comment": {
            "text": "1:10 - 1:27 - 1",
            "emoji": ""
        },
        "id": "7510549124679948"
    },
    {
        "content": {
            "text": "Researchers have also begun to study task transfer, the problem of generalizing from a set oftasks at meta-train time to unseen tasks at meta-test time. Evaluation requires tasks (e.g., NLI)appearing in Etest not to appear in Etrain or Eval. Prior work has used GLUE tasks [70] for meta-trainingbefore meta-testing on tasks such as entity typing [3, 4], while other work instead used GLUE for"
        },
        "position": {
            "boundingRect": {
                "x1": 163.9320068359375,
                "y1": 981.5997924804688,
                "x2": 928.99951171875,
                "y2": 1048.7744140625,
                "width": 929,
                "height": 1202.235294117647,
                "pageNumber": 3
            },
            "rects": [
                {
                    "x1": 163.9329833984375,
                    "y1": 981.5997924804688,
                    "x2": 928.9991455078125,
                    "y2": 999.0997924804688,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.9320068359375,
                    "y1": 998.1637573242188,
                    "x2": 928.99951171875,
                    "y2": 1015.6637573242188,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.9346923828125,
                    "y1": 1014.7191772460938,
                    "x2": 928.9908447265625,
                    "y2": 1032.21923828125,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 248.6953125,
                    "y1": 1021.1171875,
                    "x2": 267.568115234375,
                    "y2": 1033.1171875,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 370.6640625,
                    "y1": 1021.1171875,
                    "x2": 394.240966796875,
                    "y2": 1033.1171875,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 417.96875,
                    "y1": 1021.1171875,
                    "x2": 430.646484375,
                    "y2": 1033.1171875,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.9354248046875,
                    "y1": 1031.2744140625,
                    "x2": 765.3055419921875,
                    "y2": 1048.7744140625,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                }
            ],
            "pageNumber": 3
        },
        "comment": {
            "text": "1:10 - 1:27 - 1",
            "emoji": ""
        },
        "id": "1846585829089442"
    },
    {
        "content": {
            "text": "Following the CV literature [67, 68], one thread of few-shot NLP focuses on class transfer, theproblem of generalizing from a supervised set of classes at meta-train time to a different set of classesfrom the same dataset at meta-test time. Evaluation typically involves splitting classes YD into YDtrain,YDval and YDtest disjoint subsets. Class transfer has been studied on many text classification tasks [5],including relation classification [25, 28, 64], intent classification [37, 64], inter alia. In contrast,domain transfer keeps the same classes between meta-training and meta-testing but changes thetextual domain (e.g., generalizing from MNLI to science-focused SciTail [4, 21]). Evaluation thenrequires identifying pairs of datasets with the same classes YD, where one dataset’s episodes areassigned to Etrain and the other’s to Etest. Domain transfer has also been studied on many tasks [3, 4],including dialogue intent detection & slot tagging [31], sentiment classification [77], NLI [21], andmachine translation [27, 58]."
        },
        "position": {
            "boundingRect": {
                "x1": 163.930908203125,
                "y1": 789.2396240234375,
                "x2": 928.99853515625,
                "y2": 974.2191772460938,
                "width": 929,
                "height": 1202.235294117647,
                "pageNumber": 3
            },
            "rects": [
                {
                    "x1": 163.9337158203125,
                    "y1": 789.2396240234375,
                    "x2": 928.989501953125,
                    "y2": 806.7396240234375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.9326171875,
                    "y1": 805.7894897460938,
                    "x2": 765.052978515625,
                    "y2": 823.2894897460938,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 744.296875,
                    "y1": 821,
                    "x2": 760.6875,
                    "y2": 833,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.9332275390625,
                    "y1": 822.3519897460938,
                    "x2": 744.2734375,
                    "y2": 841.4457397460938,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 763.2049560546875,
                    "y1": 822.3519897460938,
                    "x2": 767.4080810546875,
                    "y2": 839.8519897460938,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 691.6875,
                    "y1": 829.7578125,
                    "x2": 705.9671630859375,
                    "y2": 842.2421875,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 743.0546875,
                    "y1": 830.59375,
                    "x2": 762.4705810546875,
                    "y2": 842.59375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 191.25,
                    "y1": 839.7132568359375,
                    "x2": 227.966552734375,
                    "y2": 858.8538818359375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 174.666748046875,
                    "y1": 839.7196044921875,
                    "x2": 189.479248046875,
                    "y2": 851.7196044921875,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 227.99560546875,
                    "y1": 839.7196044921875,
                    "x2": 928.99853515625,
                    "y2": 851.7196044921875,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 246.609375,
                    "y1": 840.7969970703125,
                    "x2": 766.949951171875,
                    "y2": 858.2969970703125,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.933837890625,
                    "y1": 840.7991943359375,
                    "x2": 174.019775390625,
                    "y2": 858.2991943359375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 227.375,
                    "y1": 848.6796875,
                    "x2": 246.62353515625,
                    "y2": 860.6796875,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 174.046875,
                    "y1": 849.046875,
                    "x2": 191.265625,
                    "y2": 861.046875,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.9361572265625,
                    "y1": 857.3671875,
                    "x2": 928.9918212890625,
                    "y2": 874.8671875,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.932861328125,
                    "y1": 873.9223022460938,
                    "x2": 928.99658203125,
                    "y2": 891.4223022460938,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.9342041015625,
                    "y1": 890.4840698242188,
                    "x2": 765.0616455078125,
                    "y2": 907.9840698242188,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.930908203125,
                    "y1": 907.0394897460938,
                    "x2": 928.983642578125,
                    "y2": 924.5394897460938,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 543.499267578125,
                    "y1": 913.43896484375,
                    "x2": 551.147705078125,
                    "y2": 925.43896484375,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.930908203125,
                    "y1": 923.6019897460938,
                    "x2": 928.998046875,
                    "y2": 941.1019897460938,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 243.1171875,
                    "y1": 930.0078125,
                    "x2": 398.1676025390625,
                    "y2": 942.0078125,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.931884765625,
                    "y1": 940.1572265625,
                    "x2": 765.06103515625,
                    "y2": 957.6572265625,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.9310302734375,
                    "y1": 956.7191772460938,
                    "x2": 338.2392578125,
                    "y2": 974.2191772460938,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                }
            ],
            "pageNumber": 3
        },
        "comment": {
            "text": "0:50 - 1:10 - 3",
            "emoji": ""
        },
        "id": "813582973835969"
    },
    {
        "content": {
            "text": "Few-shot background and notation Broadly, modern approaches to few-shot learning are evalu-ated in a three-phase procedure [68]. In the first phase, a general-purpose pretrained model is obtained.In the subsequent “meta-training” phase,8 techniques aim to adapt the model to be well-suited forfew-shot generalization. Finally, a “meta-testing” phase evaluates the adapted model in new few-shotprediction settings."
        },
        "position": {
            "boundingRect": {
                "x1": 163.930419921875,
                "y1": 432.58209228515625,
                "x2": 928.998291015625,
                "y2": 525.5551147460938,
                "width": 929,
                "height": 1202.235294117647,
                "pageNumber": 3
            },
            "rects": [
                {
                    "x1": 389.765625,
                    "y1": 432.58209228515625,
                    "x2": 928.998291015625,
                    "y2": 459.16021728515625,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.930419921875,
                    "y1": 441.82427978515625,
                    "x2": 767.5780029296875,
                    "y2": 459.32427978515625,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.9317626953125,
                    "y1": 458.3754577636719,
                    "x2": 767.6953125,
                    "y2": 475.8754577636719,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.9349365234375,
                    "y1": 474.9379577636719,
                    "x2": 928.98828125,
                    "y2": 492.4379577636719,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.93701171875,
                    "y1": 491.4926452636719,
                    "x2": 765.05517578125,
                    "y2": 508.9926452636719,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                },
                {
                    "x1": 163.9371337890625,
                    "y1": 508.0551452636719,
                    "x2": 279.03955078125,
                    "y2": 525.5551147460938,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 3
                }
            ],
            "pageNumber": 3
        },
        "comment": {
            "text": "0:20 - 0:50 - 4",
            "emoji": ""
        },
        "id": "5322513271780764"
    },
    {
        "content": {
            "text": "FLEX: Unifying Evaluation for Few-Shot NLPJonathan Bragg∗ Arman Cohan∗ Kyle Lo Iz BeltagyAllen Institute for AI, Seattle, WA{jbragg,armanc,kylel,beltagy}@allenai.org"
        },
        "position": {
            "boundingRect": {
                "x1": 204.3072509765625,
                "y1": 148.6942596435547,
                "x2": 724.6904296875,
                "y2": 300.5235290527344,
                "width": 929,
                "height": 1202.235294117647,
                "pageNumber": 1
            },
            "rects": [
                {
                    "x1": 204.3072509765625,
                    "y1": 148.6942596435547,
                    "x2": 724.6904296875,
                    "y2": 178.6942596435547,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 1
                },
                {
                    "x1": 358.8671875,
                    "y1": 209.55154418945312,
                    "x2": 574.9609375,
                    "y2": 262.2468566894531,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 1
                },
                {
                    "x1": 358.8671875,
                    "y1": 241.27810668945312,
                    "x2": 392.9488525390625,
                    "y2": 253.27810668945312,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 1
                },
                {
                    "x1": 485.73388671875,
                    "y1": 241.27810668945312,
                    "x2": 519.8160400390625,
                    "y2": 253.27810668945312,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 1
                },
                {
                    "x1": 255.3148193359375,
                    "y1": 242.638916015625,
                    "x2": 358.8646240234375,
                    "y2": 260.138916015625,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 1
                },
                {
                    "x1": 392.8984375,
                    "y1": 242.638916015625,
                    "x2": 485.74609375,
                    "y2": 260.138916015625,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 1
                },
                {
                    "x1": 519.765625,
                    "y1": 242.638916015625,
                    "x2": 574.9609375,
                    "y2": 260.138916015625,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 1
                },
                {
                    "x1": 604.7890625,
                    "y1": 242.638916015625,
                    "x2": 669.898193359375,
                    "y2": 260.138916015625,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 1
                },
                {
                    "x1": 360.609130859375,
                    "y1": 263.7396545410156,
                    "x2": 567.60400390625,
                    "y2": 281.2396545410156,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 1
                },
                {
                    "x1": 318.0460205078125,
                    "y1": 284.5235290527344,
                    "x2": 610.954833984375,
                    "y2": 300.5235290527344,
                    "width": 929,
                    "height": 1202.235294117647,
                    "pageNumber": 1
                }
            ],
            "pageNumber": 1
        },
        "comment": {
            "text": "0:00 - 0:20 - 5",
            "emoji": ""
        },
        "id": "98678211358407"
    }
];