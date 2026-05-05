'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { UserWorkflow } from '@/types/workflow';
import { workflowApi } from '@/lib/apiWorkflow';
import { automationApi, UserAutomation } from '@/lib/apiAutomation';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageLoader } from '@/components/ui/PageLoader';
import { PlusIcon } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';

interface WorkflowListProps {
  onAddWorkflow: () => void;
  onEditWorkflow: (workflow: UserWorkflow) => void;
  onManageSchedules: (workflowId: number) => void;
  onExecuteWorkflow: (workflowId: number) => void;
  onViewDetails: (workflowId: number) => void;
  onGoToAutomation?: (automation: UserAutomation) => void;
  refreshTrigger?: number;
  executingWorkflowId?: number | null;
}

const MenuDetailsIcon = () => (
  <svg width="79" height="20" viewBox="0 0 79 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M18.3327 8.33317V12.4998C18.3327 16.6665 16.666 18.3332 12.4993 18.3332H7.49935C3.33268 18.3332 1.66602 16.6665 1.66602 12.4998V7.49984C1.66602 3.33317 3.33268 1.6665 7.49935 1.6665H11.666" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.3327 8.33317H14.9993C12.4993 8.33317 11.666 7.49984 11.666 4.99984V1.6665L18.3327 8.33317Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.83398 10.8335H10.834" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.83398 14.1665H9.16732" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M29.47 15V5.2H33.6C34.6453 5.2 35.5647 5.40533 36.358 5.816C37.1607 6.22667 37.7813 6.80067 38.22 7.538C38.668 8.27533 38.892 9.12933 38.892 10.1C38.892 11.0707 38.668 11.9247 38.22 12.662C37.7813 13.3993 37.1607 13.9733 36.358 14.384C35.5647 14.7947 34.6453 15 33.6 15H29.47ZM30.87 13.782H33.516C34.328 13.782 35.028 13.628 35.616 13.32C36.2133 13.012 36.6753 12.5827 37.002 12.032C37.3287 11.472 37.492 10.828 37.492 10.1C37.492 9.36267 37.3287 8.71867 37.002 8.168C36.6753 7.61733 36.2133 7.188 35.616 6.88C35.028 6.572 34.328 6.418 33.516 6.418H30.87V13.782ZM44.4244 15.084C43.6311 15.084 42.9311 14.9207 42.3244 14.594C41.7271 14.2673 41.2604 13.8193 40.9244 13.25C40.5977 12.6807 40.4344 12.0273 40.4344 11.29C40.4344 10.5527 40.5931 9.89933 40.9104 9.33C41.2371 8.76067 41.6804 8.31733 42.2404 8C42.8097 7.67333 43.4491 7.51 44.1584 7.51C44.8771 7.51 45.5117 7.66867 46.0624 7.986C46.6131 8.30333 47.0424 8.75133 47.3504 9.33C47.6677 9.89933 47.8264 10.5667 47.8264 11.332C47.8264 11.388 47.8217 11.4533 47.8124 11.528C47.8124 11.6027 47.8077 11.6727 47.7984 11.738H41.4844V10.772H47.0984L46.5524 11.108C46.5617 10.632 46.4637 10.2073 46.2584 9.834C46.0531 9.46067 45.7684 9.17133 45.4044 8.966C45.0497 8.75133 44.6344 8.644 44.1584 8.644C43.6917 8.644 43.2764 8.75133 42.9124 8.966C42.5484 9.17133 42.2637 9.46533 42.0584 9.848C41.8531 10.2213 41.7504 10.6507 41.7504 11.136V11.36C41.7504 11.8547 41.8624 12.298 42.0864 12.69C42.3197 13.0727 42.6417 13.3713 43.0524 13.586C43.4631 13.8007 43.9344 13.908 44.4664 13.908C44.9051 13.908 45.3017 13.8333 45.6564 13.684C46.0204 13.5347 46.3377 13.3107 46.6084 13.012L47.3504 13.88C47.0144 14.272 46.5944 14.5707 46.0904 14.776C45.5957 14.9813 45.0404 15.084 44.4244 15.084ZM52.5207 15.084C51.774 15.084 51.1953 14.8833 50.7847 14.482C50.374 14.0807 50.1687 13.5067 50.1687 12.76V5.956H51.5127V12.704C51.5127 13.1053 51.6107 13.4133 51.8067 13.628C52.012 13.8427 52.3013 13.95 52.6747 13.95C53.0947 13.95 53.4447 13.8333 53.7247 13.6L54.1447 14.566C53.9393 14.7433 53.692 14.874 53.4027 14.958C53.1227 15.042 52.8287 15.084 52.5207 15.084ZM48.9087 8.686V7.58H53.6407V8.686H48.9087ZM60.6555 15V13.432L60.5855 13.138V10.464C60.5855 9.89467 60.4175 9.456 60.0815 9.148C59.7549 8.83067 59.2602 8.672 58.5975 8.672C58.1589 8.672 57.7295 8.74667 57.3095 8.896C56.8895 9.036 56.5349 9.22733 56.2455 9.47L55.6855 8.462C56.0682 8.154 56.5255 7.92067 57.0575 7.762C57.5989 7.594 58.1635 7.51 58.7515 7.51C59.7689 7.51 60.5529 7.75733 61.1035 8.252C61.6542 8.74667 61.9295 9.50267 61.9295 10.52V15H60.6555ZM58.2195 15.084C57.6689 15.084 57.1835 14.9907 56.7635 14.804C56.3529 14.6173 56.0355 14.3607 55.8115 14.034C55.5875 13.698 55.4755 13.32 55.4755 12.9C55.4755 12.4987 55.5689 12.1347 55.7555 11.808C55.9515 11.4813 56.2642 11.22 56.6935 11.024C57.1322 10.828 57.7202 10.73 58.4575 10.73H60.8095V11.696H58.5135C57.8415 11.696 57.3889 11.808 57.1555 12.032C56.9222 12.256 56.8055 12.5267 56.8055 12.844C56.8055 13.208 56.9502 13.502 57.2395 13.726C57.5289 13.9407 57.9302 14.048 58.4435 14.048C58.9475 14.048 59.3862 13.936 59.7595 13.712C60.1422 13.488 60.4175 13.1613 60.5855 12.732L60.8515 13.656C60.6742 14.0947 60.3615 14.4447 59.9135 14.706C59.4655 14.958 58.9009 15.084 58.2195 15.084ZM64.6967 15V7.58H66.0407V15H64.6967ZM65.3687 6.152C65.1074 6.152 64.8881 6.068 64.7107 5.9C64.5427 5.732 64.4587 5.52667 64.4587 5.284C64.4587 5.032 64.5427 4.822 64.7107 4.654C64.8881 4.486 65.1074 4.402 65.3687 4.402C65.6301 4.402 65.8447 4.486 66.0127 4.654C66.1901 4.81267 66.2787 5.01333 66.2787 5.256C66.2787 5.508 66.1947 5.72267 66.0267 5.9C65.8587 6.068 65.6394 6.152 65.3687 6.152ZM68.8869 15V4.612H70.2309V15H68.8869ZM75.205 15.084C74.589 15.084 74.001 15 73.441 14.832C72.8904 14.664 72.4564 14.4587 72.139 14.216L72.699 13.152C73.0164 13.3667 73.4084 13.5487 73.875 13.698C74.3417 13.8473 74.8177 13.922 75.303 13.922C75.9284 13.922 76.3764 13.8333 76.647 13.656C76.927 13.4787 77.067 13.2313 77.067 12.914C77.067 12.6807 76.983 12.4987 76.815 12.368C76.647 12.2373 76.423 12.1393 76.143 12.074C75.8724 12.0087 75.569 11.9527 75.233 11.906C74.897 11.85 74.561 11.7847 74.225 11.71C73.889 11.626 73.581 11.514 73.301 11.374C73.021 11.2247 72.797 11.024 72.629 10.772C72.461 10.5107 72.377 10.1653 72.377 9.736C72.377 9.288 72.503 8.896 72.755 8.56C73.007 8.224 73.3617 7.96733 73.819 7.79C74.2857 7.60333 74.8364 7.51 75.471 7.51C75.9564 7.51 76.4464 7.57067 76.941 7.692C77.445 7.804 77.8557 7.96733 78.173 8.182L77.599 9.246C77.263 9.022 76.913 8.868 76.549 8.784C76.185 8.7 75.821 8.658 75.457 8.658C74.869 8.658 74.4304 8.756 74.141 8.952C73.8517 9.13867 73.707 9.38133 73.707 9.68C73.707 9.932 73.791 10.128 73.959 10.268C74.1364 10.3987 74.3604 10.5013 74.631 10.576C74.911 10.6507 75.219 10.716 75.555 10.772C75.891 10.8187 76.227 10.884 76.563 10.968C76.899 11.0427 77.2024 11.15 77.473 11.29C77.753 11.43 77.977 11.626 78.145 11.878C78.3224 12.13 78.411 12.466 78.411 12.886C78.411 13.334 78.2804 13.7213 78.019 14.048C77.7577 14.3747 77.389 14.6313 76.913 14.818C76.437 14.9953 75.8677 15.084 75.205 15.084Z" fill="white" />
  </svg>
);

const MenuEditIcon = () => (
  <svg width="58" height="20" viewBox="0 0 58 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M1.66797 10.7338V9.26718C1.66797 8.40052 2.3763 7.68385 3.2513 7.68385C4.75964 7.68385 5.3763 6.61718 4.61797 5.30885C4.18464 4.55885 4.44297 3.58385 5.2013 3.15052L6.64297 2.32552C7.3013 1.93385 8.1513 2.16718 8.54297 2.82552L8.63463 2.98385C9.38463 4.29218 10.618 4.29218 11.3763 2.98385L11.468 2.82552C11.8596 2.16718 12.7096 1.93385 13.368 2.32552L14.8096 3.15052C15.568 3.58385 15.8263 4.55885 15.393 5.30885C14.6346 6.61718 15.2513 7.68385 16.7596 7.68385C17.6263 7.68385 18.343 8.39218 18.343 9.26718V10.7338C18.343 11.6005 17.6346 12.3172 16.7596 12.3172C15.2513 12.3172 14.6346 13.3838 15.393 14.6922C15.8263 15.4505 15.568 16.4172 14.8096 16.8505L13.368 17.6755C12.7096 18.0672 11.8596 17.8339 11.468 17.1755L11.3763 17.0172C10.6263 15.7089 9.39297 15.7089 8.63463 17.0172L8.54297 17.1755C8.1513 17.8339 7.3013 18.0672 6.64297 17.6755L5.2013 16.8505C4.44297 16.4172 4.18464 15.4422 4.61797 14.6922C5.3763 13.3838 4.75964 12.3172 3.2513 12.3172C2.3763 12.3172 1.66797 11.6005 1.66797 10.7338Z" stroke="white" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M30.744 9.428H35.784V10.618H30.744V9.428ZM30.87 13.782H36.582V15H29.47V5.2H36.386V6.418H30.87V13.782ZM41.9032 15.084C41.1845 15.084 40.5405 14.9253 39.9712 14.608C39.4112 14.2907 38.9679 13.8473 38.6412 13.278C38.3145 12.7087 38.1512 12.046 38.1512 11.29C38.1512 10.534 38.3145 9.876 38.6412 9.316C38.9679 8.74667 39.4112 8.30333 39.9712 7.986C40.5405 7.66867 41.1845 7.51 41.9032 7.51C42.5285 7.51 43.0932 7.65 43.5972 7.93C44.1012 8.21 44.5025 8.63 44.8012 9.19C45.1092 9.75 45.2632 10.45 45.2632 11.29C45.2632 12.13 45.1139 12.83 44.8152 13.39C44.5259 13.95 44.1292 14.3747 43.6252 14.664C43.1212 14.944 42.5472 15.084 41.9032 15.084ZM42.0152 13.908C42.4819 13.908 42.9019 13.8007 43.2752 13.586C43.6579 13.3713 43.9565 13.068 44.1712 12.676C44.3952 12.2747 44.5072 11.8127 44.5072 11.29C44.5072 10.758 44.3952 10.3007 44.1712 9.918C43.9565 9.526 43.6579 9.22267 43.2752 9.008C42.9019 8.79333 42.4819 8.686 42.0152 8.686C41.5392 8.686 41.1145 8.79333 40.7412 9.008C40.3679 9.22267 40.0692 9.526 39.8452 9.918C39.6212 10.3007 39.5092 10.758 39.5092 11.29C39.5092 11.8127 39.6212 12.2747 39.8452 12.676C40.0692 13.068 40.3679 13.3713 40.7412 13.586C41.1145 13.8007 41.5392 13.908 42.0152 13.908ZM44.5492 15V12.998L44.6332 11.276L44.4932 9.554V4.612H45.8372V15H44.5492ZM48.6602 15V7.58H50.0042V15H48.6602ZM49.3322 6.152C49.0708 6.152 48.8515 6.068 48.6742 5.9C48.5062 5.732 48.4222 5.52667 48.4222 5.284C48.4222 5.032 48.5062 4.822 48.6742 4.654C48.8515 4.486 49.0708 4.402 49.3322 4.402C49.5935 4.402 49.8082 4.486 49.9762 4.654C50.1535 4.81267 50.2422 5.01333 50.2422 5.256C50.2422 5.508 50.1582 5.72267 49.9902 5.9C49.8222 6.068 49.6028 6.152 49.3322 6.152ZM55.3983 15.084C54.6517 15.084 54.073 14.8833 53.6623 14.482C53.2517 14.0807 53.0463 13.5067 53.0463 12.76V5.956H54.3903V12.704C54.3903 13.1053 54.4883 13.4133 54.6843 13.628C54.8897 13.8427 55.179 13.95 55.5523 13.95C55.9723 13.95 56.3223 13.8333 56.6023 13.6L57.0223 14.566C56.817 14.7433 56.5697 14.874 56.2803 14.958C56.0003 15.042 55.7063 15.084 55.3983 15.084ZM51.7863 8.686V7.58H56.5183V8.686H51.7863Z" fill="white" />
  </svg>
);

const MenuDeleteIcon = () => (
  <svg width="77" height="20" viewBox="0 0 77 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M17.5 4.98307C14.725 4.70807 11.9333 4.56641 9.15 4.56641C7.5 4.56641 5.85 4.64974 4.2 4.81641L2.5 4.98307" stroke="#C42B2B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.08203 4.14199L7.26536 3.05033C7.3987 2.25866 7.4987 1.66699 8.90703 1.66699H11.0904C12.4987 1.66699 12.607 2.29199 12.732 3.05866L12.9154 4.14199" stroke="#C42B2B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.7096 7.61621L15.168 16.0079C15.0763 17.3162 15.0013 18.3329 12.6763 18.3329H7.3263C5.0013 18.3329 4.9263 17.3162 4.83464 16.0079L4.29297 7.61621" stroke="#C42B2B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.60938 13.75H11.3844" stroke="#C42B2B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.91797 10.417H12.0846" stroke="#C42B2B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M29.47 15V5.2H33.6C34.6453 5.2 35.5647 5.40533 36.358 5.816C37.1607 6.22667 37.7813 6.80067 38.22 7.538C38.668 8.27533 38.892 9.12933 38.892 10.1C38.892 11.0707 38.668 11.9247 38.22 12.662C37.7813 13.3993 37.1607 13.9733 36.358 14.384C35.5647 14.7947 34.6453 15 33.6 15H29.47ZM30.87 13.782H33.516C34.328 13.782 35.028 13.628 35.616 13.32C36.2133 13.012 36.6753 12.5827 37.002 12.032C37.3287 11.472 37.492 10.828 37.492 10.1C37.492 9.36267 37.3287 8.71867 37.002 8.168C36.6753 7.61733 36.2133 7.188 35.616 6.88C35.028 6.572 34.328 6.418 33.516 6.418H30.87V13.782ZM44.4244 15.084C43.6311 15.084 42.9311 14.9207 42.3244 14.594C41.7271 14.2673 41.2604 13.8193 40.9244 13.25C40.5977 12.6807 40.4344 12.0273 40.4344 11.29C40.4344 10.5527 40.5931 9.89933 40.9104 9.33C41.2371 8.76067 41.6804 8.31733 42.2404 8C42.8097 7.67333 43.4491 7.51 44.1584 7.51C44.8771 7.51 45.5117 7.66867 46.0624 7.986C46.6131 8.30333 47.0424 8.75133 47.3504 9.33C47.6677 9.89933 47.8264 10.5667 47.8264 11.332C47.8264 11.388 47.8217 11.4533 47.8124 11.528C47.8124 11.6027 47.8077 11.6727 47.7984 11.738H41.4844V10.772H47.0984L46.5524 11.108C46.5617 10.632 46.4637 10.2073 46.2584 9.834C46.0531 9.46067 45.7684 9.17133 45.4044 8.966C45.0497 8.75133 44.6344 8.644 44.1584 8.644C43.6917 8.644 43.2764 8.75133 42.9124 8.966C42.5484 9.17133 42.2637 9.46533 42.0584 9.848C41.8531 10.2213 41.7504 10.6507 41.7504 11.136V11.36C41.7504 11.8547 41.8624 12.298 42.0864 12.69C42.3197 13.0727 42.6417 13.3713 43.0524 13.586C43.4631 13.8007 43.9344 13.908 44.4664 13.908C44.9051 13.908 45.3017 13.8333 45.6564 13.684C46.0204 13.5347 46.3377 13.3107 46.6084 13.012L47.3504 13.88C47.0144 14.272 46.5944 14.5707 46.0904 14.776C45.5957 14.9813 45.0404 15.084 44.4244 15.084ZM49.9727 15V4.612H51.3167V15H49.9727ZM57.4668 15.084C56.6735 15.084 55.9735 14.9207 55.3668 14.594C54.7695 14.2673 54.3028 13.8193 53.9668 13.25C53.6402 12.6807 53.4768 12.0273 53.4768 11.29C53.4768 10.5527 53.6355 9.89933 53.9528 9.33C54.2795 8.76067 54.7228 8.31733 55.2828 8C55.8522 7.67333 56.4915 7.51 57.2008 7.51C57.9195 7.51 58.5542 7.66867 59.1048 7.986C59.6555 8.30333 60.0848 8.75133 60.3928 9.33C60.7102 9.89933 60.8688 10.5667 60.8688 11.332C60.8688 11.388 60.8642 11.4533 60.8548 11.528C60.8548 11.6027 60.8502 11.6727 60.8408 11.738H54.5268V10.772H60.1408L59.5948 11.108C59.6042 10.632 59.5062 10.2073 59.3008 9.834C59.0955 9.46067 58.8108 9.17133 58.4468 8.966C58.0922 8.75133 57.6768 8.644 57.2008 8.644C56.7342 8.644 56.3188 8.75133 55.9548 8.966C55.5908 9.17133 55.3062 9.46533 55.1008 9.848C54.8955 10.2213 54.7928 10.6507 54.7928 11.136V11.36C54.7928 11.8547 54.9048 12.298 55.1288 12.69C55.3622 13.0727 55.6842 13.3713 56.0948 13.586C56.5055 13.8007 56.9768 13.908 57.5088 13.908C57.9475 13.908 58.3442 13.8333 58.6988 13.684C59.0628 13.5347 59.3802 13.3107 59.6508 13.012L60.3928 13.88C60.0568 14.272 59.6368 14.5707 59.1328 14.776C58.6382 14.9813 58.0828 15.084 57.4668 15.084ZM65.5631 15.084C64.8164 15.084 64.2378 14.8833 63.8271 14.482C63.4164 14.0807 63.2111 13.5067 63.2111 12.76V5.956H64.5551V12.704C64.5551 13.1053 64.6531 13.4133 64.8491 13.628C65.0544 13.8427 65.3438 13.95 65.7171 13.95C66.1371 13.95 66.4871 13.8333 66.7671 13.6L67.1871 14.566C66.9818 14.7433 66.7344 14.874 66.4451 14.958C66.1651 15.042 65.8711 15.084 65.5631 15.084ZM61.9511 8.686V7.58H66.6831V8.686H61.9511ZM72.1499 15.084C71.3565 15.084 70.6565 14.9207 70.0499 14.594C69.4525 14.2673 68.9859 13.8193 68.6499 13.25C68.3232 12.6807 68.1599 12.0273 68.1599 11.29C68.1599 10.5527 68.3185 9.89933 68.6359 9.33C68.9625 8.76067 69.4059 8.31733 69.9659 8C70.5352 7.67333 71.1745 7.51 71.8839 7.51C72.6025 7.51 73.2372 7.66867 73.7879 7.986C74.3385 8.30333 74.7679 8.75133 75.0759 9.33C75.3932 9.89933 75.5519 10.5667 75.5519 11.332C75.5519 11.388 75.5472 11.4533 75.5379 11.528C75.5379 11.6027 75.5332 11.6727 75.5239 11.738H69.2099V10.772H74.8239L74.2779 11.108C74.2872 10.632 74.1892 10.2073 73.9839 9.834C73.7785 9.46067 73.4939 9.17133 73.1299 8.966C72.7752 8.75133 72.3599 8.644 71.8839 8.644C71.4172 8.644 71.0019 8.75133 70.6379 8.966C70.2739 9.17133 69.9892 9.46533 69.7839 9.848C69.5785 10.2213 69.4759 10.6507 69.4759 11.136V11.36C69.4759 11.8547 69.5879 12.298 69.8119 12.69C70.0452 13.0727 70.3672 13.3713 70.7779 13.586C71.1885 13.8007 71.6599 13.908 72.1919 13.908C72.6305 13.908 73.0272 13.8333 73.3819 13.684C73.7459 13.5347 74.0632 13.3107 74.3339 13.012L75.0759 13.88C74.7399 14.272 74.3199 14.5707 73.8159 14.776C73.3212 14.9813 72.7659 15.084 72.1499 15.084Z" fill="#C42B2B" />
  </svg>
);

export const WorkflowList: React.FC<WorkflowListProps> = (props) => {
  const {
    onAddWorkflow,
    onEditWorkflow,
    onExecuteWorkflow,
    onViewDetails,
    onGoToAutomation,
    refreshTrigger,
    executingWorkflowId,
  } = props;
  const { isAuthenticated } = useAuth();
  const t = useTranslations('dashboard');
  const tWorkflow = useTranslations('workflow');
  const tCommon = useTranslations('common');
  const [workflows, setWorkflows] = useState<UserWorkflow[]>([]);
  const [automatizations, setAutomatizations] = useState<UserAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    workflowId: number | null;
    workflowName: string;
  }>({
    isOpen: false,
    workflowId: null,
    workflowName: ''
  });
  const [openMenuWorkflowId, setOpenMenuWorkflowId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isMountedRef = React.useRef(false);
  const prevRefreshTriggerRef = React.useRef<number | undefined>(undefined);

  useEffect(() => {
    if (isAuthenticated) return;
    isMountedRef.current = false;
    setWorkflows([]);
    setLoading(false);
    setError(null);
  }, [isAuthenticated]);

  const loadData = React.useCallback(async () => {
    try {
      if (!isAuthenticated) {
        setWorkflows([]);
        setAutomatizations([]);
        setLoading(false);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      const [workflowsData, automatizationsData] = await Promise.all([
        workflowApi.getMyWorkflows(),
        automationApi.getMyAutomatizations()
      ]);
      const workflowsArray = Array.isArray(workflowsData)
        ? workflowsData
        : ((workflowsData as { userWorkflows?: UserWorkflow[] })?.userWorkflows ||
           (workflowsData as { data?: UserWorkflow[] })?.data ||
           []);
      const automatizationsArray = Array.isArray(automatizationsData) ? automatizationsData : [];
      setWorkflows(workflowsArray);
      setAutomatizations(automatizationsArray);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !isMountedRef.current) {
      isMountedRef.current = true;
      loadData();
    }
  }, [isAuthenticated, loadData]);

  useEffect(() => {
    if (isMountedRef.current && refreshTrigger !== undefined && prevRefreshTriggerRef.current !== refreshTrigger) {
      prevRefreshTriggerRef.current = refreshTrigger;
      loadData();
    }
  }, [refreshTrigger, loadData]);

  useEffect(() => {
    if (!openMenuWorkflowId) return;

    const handleOutsideClick = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuWorkflowId(null);
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [openMenuWorkflowId]);

  const handleDelete = useCallback((id: number, name: string) => {
    setDeleteDialog({
      isOpen: true,
      workflowId: id,
      workflowName: name
    });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deleteDialog.workflowId) {
      try {
        await workflowApi.deleteUserWorkflow(deleteDialog.workflowId);
        await loadData();
      } catch (err) {
        console.error('Error deleting workflow:', err);
      }
    }
    setDeleteDialog({ isOpen: false, workflowId: null, workflowName: '' });
  }, [deleteDialog.workflowId, loadData]);

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialog({ isOpen: false, workflowId: null, workflowName: '' });
  }, []);

  const deleteMessage = useMemo(() => 
    tWorkflow('deleteConfirmMessage', { name: deleteDialog.workflowName }),
    [deleteDialog.workflowName, tWorkflow]
  );

  const renderCard = (workflow: UserWorkflow) => {
    const cardName = workflow.name || workflow.workflow?.name || t('noWorkflows');
    const cardDescription = workflow.description || workflow.workflow?.description || '';
    const priceValue = workflow.workflow?.priceUsd || '—';

    return (
      <div
        key={workflow.id}
        className="relative w-full rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 text-[14px] leading-[1.4] tracking-[0.28px] font-medium text-[var(--color-secondary-10)] truncate">
            {cardName}
          </p>
          <div className="h-6 min-w-[25px] rounded-[7px] border border-[#34C759] px-[10px] flex items-center justify-center">
            <span className="text-[12px] leading-[1.4] tracking-[0.24px] text-[#34C759]">{priceValue}</span>
          </div>
        </div>

        <p className="mt-2 text-[12px] leading-[1.4] tracking-[0.24px] text-[var(--color-secondary-8)] line-clamp-3 min-h-[50px]">
          {cardDescription || t('createManageRun')}
        </p>

        <div className="mt-2">
          <span className={`inline-flex h-7 items-center rounded-[47px] border px-3 text-[12px] leading-[1.4] tracking-[0.24px] font-semibold ${
            workflow.isActive
              ? 'border-[#34C759] text-[#34C759]'
              : 'border-[var(--color-secondary-5)] text-[var(--color-secondary-5)]'
          }`}>
            {workflow.isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>

        <div className="mt-4 h-px w-full bg-[var(--color-secondary-4)]" />

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onExecuteWorkflow(workflow.id)}
            disabled={executingWorkflowId === workflow.id || !workflow.isActive}
            className="flex-1 h-12 rounded-[10px] bg-[var(--color-main)] text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-[var(--color-secondary-10)] disabled:opacity-60"
          >
            {tWorkflow('execute')}
          </button>
          <button
            type="button"
            onClick={() => setOpenMenuWorkflowId((prev) => (prev === workflow.id ? null : workflow.id))}
            className="h-12 w-12 rounded-[10px] border border-[var(--color-main)] text-[var(--color-main)] text-[18px] leading-none"
            aria-label="Open workflow menu"
          >
            ...
          </button>
        </div>

        {openMenuWorkflowId === workflow.id && (
          <div
            ref={menuRef}
            className="absolute right-0 top-[calc(100%+8px)] z-20 w-[148px] md:w-[130px] rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] overflow-hidden"
          >
            <button
              type="button"
              onClick={() => {
                setOpenMenuWorkflowId(null);
                onViewDetails(workflow.id);
              }}
              className="w-full h-11 px-4 md:px-3 text-left text-[14px] md:text-[12px] text-[var(--color-secondary-10)] hover:bg-[var(--color-secondary-3)] flex items-center border-b border-[var(--color-secondary-4)]"
            >
              <MenuDetailsIcon />
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenMenuWorkflowId(null);
                onEditWorkflow(workflow);
              }}
              className="w-full h-11 px-4 md:px-3 text-left text-[14px] md:text-[12px] text-[var(--color-secondary-10)] hover:bg-[var(--color-secondary-3)] flex items-center border-b border-[var(--color-secondary-4)]"
            >
              <MenuEditIcon />
            </button>
            <button
              type="button"
              onClick={() => {
                setOpenMenuWorkflowId(null);
                handleDelete(workflow.id, workflow.name || workflow.workflow.name);
              }}
              className="w-full h-11 px-4 md:px-3 text-left text-[14px] md:text-[12px] text-[#C42B2B] hover:bg-[var(--color-secondary-3)] flex items-center"
            >
              <MenuDeleteIcon />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Automation card: no 3-dots menu, only "Go To" button (external services)
  const renderAutomationCard = (automation: UserAutomation) => {
    const cardName = automation.name || automation.automation?.name || t('noWorkflows');
    const cardDescription = automation.description ?? automation.automation?.description ?? '';
    const hasPrice = automation.priceUsd != null && automation.priceUsd !== '';
    const priceValue = automation.priceUsd || automation.automation?.priceUsd || '—';

    return (
      <div
        key={automation.id}
        className="relative w-full rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 text-[14px] leading-[1.4] tracking-[0.28px] font-medium text-[var(--color-secondary-10)] truncate">
            {cardName}
          </p>
          {hasPrice && (
            <div className="h-6 min-w-[25px] rounded-[7px] border border-[#34C759] px-[10px] flex items-center justify-center">
              <span className="text-[12px] leading-[1.4] tracking-[0.24px] text-[#34C759]">{priceValue}</span>
            </div>
          )}
        </div>

        <p className="mt-2 text-[12px] leading-[1.4] tracking-[0.24px] text-[var(--color-secondary-8)] line-clamp-3 min-h-[50px]">
          {cardDescription || t('createManageRun')}
        </p>

        <div className="mt-4 h-px w-full bg-[var(--color-secondary-4)]" />

        <div className="mt-4">
          <button
            type="button"
            onClick={() => onGoToAutomation?.(automation)}
            className="w-full h-12 rounded-[10px] bg-[var(--color-main)] text-[16px] leading-[1.4] tracking-[0.32px] font-semibold text-[var(--color-secondary-10)]"
          >
            {t('goTo')}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <PageLoader label={tCommon('loading')} />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors mx-auto shadow-lg shadow-purple-500/25"
        >
          <PlusIcon className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  const hasWorkflows = workflows.length > 0;
  const hasAutomatizations = automatizations.length > 0;
  const isEmpty = !hasWorkflows && !hasAutomatizations;

  return (
    <div className="space-y-5 relative min-h-[400px]">
      <div className="space-y-1">
        <h1 className="text-[32px] md:text-[40px] leading-[1.4] tracking-[0.64px] font-semibold text-[var(--color-secondary-10)]">
          {t('title')}
        </h1>
      </div>

      {isEmpty ? (
        <div className="rounded-[10px] border border-[var(--color-secondary-4)] bg-[var(--color-secondary-2)] p-6">
          <p className="text-[16px] text-[var(--color-secondary-10)]">{t('noWorkflows')}</p>
          <button
            type="button"
            onClick={onAddWorkflow}
            className="mt-4 h-10 rounded-[10px] bg-[var(--color-main)] px-4 text-[14px] font-semibold text-[var(--color-secondary-10)] inline-flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            {t('addWorkflow')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {hasWorkflows && (
            <section>
              <h3 className="text-[18px] leading-[1.4] font-semibold text-[var(--color-secondary-10)] mb-4">
                {t('sectionWorkflow')}
              </h3>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {workflows.map((workflow) => renderCard(workflow))}
              </div>
            </section>
          )}
          {hasAutomatizations && (
            <section>
              <h3 className="text-[18px] leading-[1.4] font-semibold text-[var(--color-secondary-10)] mb-4">
                {t('sectionAutomation')}
              </h3>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {automatizations.map((automation) => renderAutomationCard(automation))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={confirmDelete}
          title={tWorkflow('deleteConfirm')}
        message={deleteMessage}
        confirmText={tCommon('delete') || 'Delete'}
        cancelText={tCommon('cancel') || 'Cancel'}
        type="danger"
      />
    </div>
  );
};
